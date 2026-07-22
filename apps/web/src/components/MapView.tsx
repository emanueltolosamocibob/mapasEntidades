import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { DomEvent, latLng, latLngBounds, point, type LatLngBounds } from "leaflet";
import {
  Footprints,
  Map as MapIcon,
  Maximize,
  Minimize,
  Minus,
  Mountain,
  Plus,
  Satellite,
  Waypoints,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import RecenterButton from "./RecenterButton";
import Compass from "./Compass";
import ConfirmDialog from "./ConfirmDialog";
import MarkerCreateDialog from "./MarkerCreateDialog";
import {
  playerMarkerIcon,
  distanceLabelIcon,
  mapMarkerIcon,
  MAP_MARKER_LABELS,
  ENEMY_COLOR,
  type MapMarkerIconType,
} from "../lib/tacticalIcon";
import { useMapMarkers, type MapMarker } from "../hooks/useMapMarkers";
import { useMapMarkerActions } from "../hooks/useMapMarkerActions";
import { usePositionTrails, type PositionTrail } from "../hooks/usePositionTrails";

type PlayerPosition = {
  entityId: string;
  nickname: string;
  role: string;
  lat: number;
  lng: number;
  teamId?: string | null;
  // Opcional: en replay no aplica el tag de "hace X" (MAP-51), solo en vivo.
  recordedAt?: string;
};

type Restriction = { lat: number; lng: number; radiusM: number };

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";
const TOPO_URL = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
const TOPO_ATTRIBUTION =
  'map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
// OpenTopoMap no tiene tiles nativos más allá de este zoom — Leaflet
// sobre-escala los últimos automáticamente, se ve borroso pero funciona.
const TOPO_MAX_NATIVE_ZOOM = 17;

// Esri World Imagery: satelital/aéreo, gratis, sin API key. Nota el orden
// {z}/{y}/{x} (no {z}/{x}/{y} como el resto) -- así lo pide el esquema de
// tiles de ArcGIS.
const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";
const SATELLITE_MAX_NATIVE_ZOOM = 19;

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const MAX_ZOOM = 20;
const POSITIONS_FIT_PADDING: [number, number] = [40, 40];
const RESTRICTION_FIT_PADDING: [number, number] = [50, 50];
const STATUS_DISPLAY_MS = 5000;
const STATUS_FADE_MS = 300;

function boundsForPositions(positions: PlayerPosition[]) {
  if (positions.length === 1) {
    const { lat, lng } = positions[0];
    const delta = 0.004; // ~400m de margen para un solo jugador
    return latLngBounds([lat - delta, lng - delta], [lat + delta, lng + delta]);
  }
  return latLngBounds(positions.map((position) => [position.lat, position.lng]));
}

// Misma referencia de "área de la partida" que usan FitToPositions y
// FitToRestriction para su fitBounds inicial — reutilizada acá para
// calcular el 100% del indicador de zoom sin depender de setMinZoom
// (que en modo libre no se llama, ver nota en FitToPositions).
function getFitReference(
  positions: PlayerPosition[],
  restriction: Restriction | null
): { bounds: LatLngBounds; padding: [number, number] } | null {
  if (restriction) {
    return {
      bounds: latLng(restriction.lat, restriction.lng).toBounds(restriction.radiusM),
      padding: RESTRICTION_FIT_PADDING,
    };
  }
  if (positions.length > 0) {
    return { bounds: boundsForPositions(positions), padding: POSITIONS_FIT_PADDING };
  }
  return null;
}

function pairwiseDistances(positions: PlayerPosition[]) {
  const pairs: { key: string; from: PlayerPosition; to: PlayerPosition; distanceM: number }[] =
    [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const from = positions[i];
      const to = positions[j];
      pairs.push({
        key: `${from.entityId}:${to.entityId}`,
        from,
        to,
        distanceM: latLng(from.lat, from.lng).distanceTo(latLng(to.lat, to.lng)),
      });
    }
  }

  return pairs;
}

function DistanceLines({ positions }: { positions: PlayerPosition[] }) {
  const pairs = pairwiseDistances(positions);

  return (
    <>
      {pairs.map(({ key, from, to, distanceM }) => (
        <Polyline
          key={key}
          positions={[
            [from.lat, from.lng],
            [to.lat, to.lng],
          ]}
          pathOptions={{ color: "#F5A623", weight: 1, dashArray: "4 4", opacity: 0.6 }}
        >
          <Marker
            position={[(from.lat + to.lat) / 2, (from.lng + to.lng) / 2]}
            icon={distanceLabelIcon(distanceM)}
            interactive={false}
          />
        </Polyline>
      ))}
    </>
  );
}

// Rastro reciente por jugador (MAP-57) -- una polyline fina por entidad,
// color de equipo (mismo criterio que colorForTeam usa para los
// marcadores), no interactiva.
function PositionTrails({
  trails,
  myTeamId,
  teamColors,
}: {
  trails: PositionTrail[];
  myTeamId: string | null | undefined;
  teamColors: Record<string, string> | undefined;
}) {
  return (
    <>
      {trails.map((trail) =>
        trail.points.length < 2 ? null : (
          <Polyline
            key={trail.entityId}
            positions={trail.points.map((p) => [p.lat, p.lng])}
            interactive={false}
            pathOptions={{
              color: colorForTeam(trail.teamId, myTeamId, teamColors) ?? "#F5A623",
              weight: 2,
              opacity: 0.5,
            }}
          />
        )
      )}
    </>
  );
}

function TrailToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="Mostrar rastro de jugadores"
      title="Mostrar rastro de jugadores"
      className={`absolute top-3 right-[188px] z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10 ${
        enabled ? "bg-primary/20" : ""
      }`}
    >
      <Footprints className="h-4 w-4" />
    </button>
  );
}

function DistanceLinesToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="Mostrar líneas de distancia"
      title="Mostrar líneas de distancia"
      className={`absolute top-3 right-3 z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10 ${
        enabled ? "bg-primary/20" : ""
      }`}
    >
      <Waypoints className="h-4 w-4" />
    </button>
  );
}

const MAP_MODE_ICON = { dark: MapIcon, topo: Mountain, satellite: Satellite } as const;
const MAP_MODE_LABEL = { dark: "NORMAL", topo: "TOPOGRÁFICO", satellite: "SATELITAL" } as const;

// Un solo botón cicla los 3 modos (dark → topo → satelital → dark) en vez
// de un toggle por modo -- el ícono y el label de estado (NORMAL/
// TOPOGRÁFICO/SATELITAL) reflejan el modo actual.
function MapModeToggle({
  mode,
  onToggle,
}: {
  mode: "dark" | "topo" | "satellite";
  onToggle: () => void;
}) {
  const Icon = MAP_MODE_ICON[mode];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Cambiar vista del mapa"
      title="Cambiar vista del mapa"
      className={`absolute top-3 right-[100px] z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10 ${
        mode !== "dark" ? "bg-primary/20" : ""
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// Pseudo-fullscreen por CSS en vez de la Fullscreen API nativa
// (element.requestFullscreen()) -- iOS Safari no la soporta para elementos
// genéricos (solo <video> tiene su propio fullscreen), así que el botón no
// hacía nada en mobile. Con un toggle de estado + clase CSS funciona igual
// en todos lados, y de paso evita el gotcha de que ni className ni style de
// MapContainer son reactivos (ver MapModeClassSync) -- el estado vive en
// MapView (isFullscreen prop) y este componente solo aplica el efecto.
function FullscreenToggle({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
}) {
  const map = useMap();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) DomEvent.disableClickPropagation(buttonRef.current);
  }, []);

  useEffect(() => {
    map.getContainer().classList.toggle("map-pseudo-fullscreen", isFullscreen);
    // El contenedor cambia de tamaño vía CSS, Leaflet no se entera solo.
    const timeout = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(timeout);
  }, [map, isFullscreen]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-pressed={isFullscreen}
      aria-label="Pantalla completa"
      title="Pantalla completa"
      className="absolute top-3 right-[144px] z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10"
    >
      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
    </button>
  );
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

// Leaflet normaliza touch a eventos de mouse (mousedown/mouseup/mousemove),
// así que este mismo listener sirve para desktop y mobile sin lógica
// separada de touchstart/touchend. Si el dedo/mouse se mueve más de la
// tolerancia antes de que se cumpla el tiempo, se cancela -- así no
// confunde un pan/drag del mapa con un "mantener presionado" (MAP-57).
function MarkerLongPress({
  onLongPress,
}: {
  onLongPress: (point: { lat: number; lng: number }) => void;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  function clear() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    startPointRef.current = null;
  }

  useMapEvents({
    mousedown(event) {
      startPointRef.current = { x: event.containerPoint.x, y: event.containerPoint.y };
      timeoutRef.current = setTimeout(() => {
        onLongPress({ lat: event.latlng.lat, lng: event.latlng.lng });
        clear();
      }, LONG_PRESS_MS);
    },
    mouseup: clear,
    movestart: clear,
    mousemove(event) {
      if (!startPointRef.current) return;
      const dx = event.containerPoint.x - startPointRef.current.x;
      const dy = event.containerPoint.y - startPointRef.current.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX) clear();
    },
    // Sin esto, mantener presionado sobre un tile (una <img>) dispara el
    // menú contextual nativo del navegador (Android: "descargar imagen"),
    // que se come el gesto y el picker nunca llega a abrirse. En iOS hace
    // falta además -webkit-touch-callout:none por CSS (ver index.css).
    contextmenu(event) {
      event.originalEvent.preventDefault();
    },
  });

  useEffect(() => clear, []);

  return null;
}

// react-leaflet v5 solo lee el className de MapContainer en el mount inicial
// (useState sin setter en su código fuente) -- pasarlo como prop reactiva no
// funciona, hay que tocar el classList del contenedor a mano vía useMap(),
// mismo patrón que FullscreenToggle.
function MapModeClassSync({ mode }: { mode: "dark" | "topo" | "satellite" }) {
  const map = useMap();

  useEffect(() => {
    map.getContainer().classList.toggle("map-mode-bright", mode !== "dark");
  }, [map, mode]);

  return null;
}

function isOutOfBounds(position: PlayerPosition, restriction: Restriction | null) {
  if (!restriction) return false;
  const distance = latLng(position.lat, position.lng).distanceTo(
    latLng(restriction.lat, restriction.lng)
  );
  return distance > restriction.radiusM;
}

function FitToPositions({ positions }: { positions: PlayerPosition[] }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (hasFitOnce.current || positions.length === 0) return;
    hasFitOnce.current = true;

    map.invalidateSize();
    const bounds = boundsForPositions(positions);
    // Solo el encuadre inicial — sin restricción, "movimiento libre" tiene
    // que ser realmente libre: sin maxBounds ni minZoom.
    map.fitBounds(bounds, { padding: POSITIONS_FIT_PADDING, animate: false });
  }, [positions, map]);

  return null;
}

function FitToRestriction({ restriction }: { restriction: Restriction }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (hasFitOnce.current) return;
    hasFitOnce.current = true;

    map.invalidateSize();
    const bounds = latLng(restriction.lat, restriction.lng).toBounds(restriction.radiusM);

    // animate: false — si no, fitBounds anima el zoom de forma asíncrona
    // y el getZoom() de abajo lee el valor viejo, antes de que termine.
    map.fitBounds(bounds, { padding: RESTRICTION_FIT_PADDING, animate: false });
    // Padding extra (además del de arriba) para que al acercar el zoom al
    // máximo siga habiendo margen para pasear por todo el círculo, no solo
    // por el centro.
    map.setMaxBounds(bounds.pad(0.6));
    // Sin esto se puede alejar el zoom hasta cargar el mapa mundial completo.
    map.setMinZoom(map.getZoom());
  }, [restriction, map]);

  return null;
}

function TacticalZoomControl({
  positions,
  restriction,
}: {
  positions: PlayerPosition[];
  restriction: Restriction | null;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [center, setCenter] = useState(map.getCenter());

  useEffect(() => setZoom(map.getZoom()), [positions, restriction, map]);

  // moveend/zoomend (no move/zoom) a propósito -- disparan una sola vez
  // cuando el pan/zoom termina, no en cada frame intermedio del gesto.
  // Con move/zoom el label de lat/lng recalcularía y re-renderizaría
  // decenas de veces por segundo mientras se arrastra el mapa.
  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      setCenter(map.getCenter());
    },
    moveend: () => setCenter(map.getCenter()),
  });

  const fitRef = getFitReference(positions, restriction);
  const baselineZoom = fitRef
    ? map.getBoundsZoom(fitRef.bounds, false, point(fitRef.padding[0], fitRef.padding[1]))
    : zoom;
  const percent = Math.round(2 ** (zoom - baselineZoom) * 100);

  const minZoom = map.getMinZoom();
  const maxZoom = map.getMaxZoom();
  const atMin = zoom <= minZoom;
  const atMax = zoom >= maxZoom;

  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col border border-primary bg-background/90 text-primary">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => map.zoomOut()}
          disabled={atMin}
          aria-label="Alejar zoom"
          className="flex h-9 w-9 items-center justify-center hover:bg-primary/10 disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-transparent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="border-x border-primary px-2 text-xs tracking-[0.15em] whitespace-nowrap">
          Zoom {percent}%
        </span>
        <button
          type="button"
          onClick={() => map.zoomIn()}
          disabled={atMax}
          aria-label="Acercar zoom"
          className="flex h-9 w-9 items-center justify-center hover:bg-primary/10 disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-transparent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <span className="border-t border-primary px-2 py-1 text-center text-[10px] tracking-[0.1em] whitespace-nowrap">
        {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
      </span>
    </div>
  );
}

// Retículo del centro del mapa: dos líneas finas + un cuadrado sin relleno
// donde se cruzan. Fijo al centro del viewport del mapa (no a una
// coordenada geográfica) -- por eso es puro CSS estático, sin listeners ni
// estado, no se recalcula en cada pan/zoom.
function CenterReticle() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[900]">
      <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-primary/50" />
      <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-primary/50" />
      <div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 border border-primary" />
    </div>
  );
}

function colorForTeam(
  teamId: string | null | undefined,
  myTeamId: string | null | undefined,
  teamColors: Record<string, string> | undefined
): string | undefined {
  if (teamColors && teamId && teamColors[teamId]) {
    return teamColors[teamId];
  }
  if (myTeamId != null && teamId != null && teamId !== myTeamId) {
    return ENEMY_COLOR;
  }
  return undefined;
}

function MapView({
  positions,
  restriction,
  myTeamId,
  teamColors,
  sessionId,
  userId,
}: {
  positions: PlayerPosition[];
  restriction: Restriction | null;
  // Si se pasa, los marcadores de un equipo distinto al propio se pintan
  // en rojo (replay con varios equipos a la vez). Sin este prop, el mapa
  // se comporta como siempre (uso en vivo, donde solo se ve el propio
  // equipo de todos modos).
  myTeamId?: string | null;
  // Mapa team_id → color explícito — cada equipo con su propio color
  // (panel de anfitrión, "ver todos los equipos"). Tiene prioridad sobre
  // la lógica de myTeamId si ambos se pasan.
  teamColors?: Record<string, string>;
  // Marcadores tácticos (MAP-57): sesión + usuario actual. Sin ambos +
  // myTeamId, los marcadores se ven (si sessionId está) pero no se puede
  // agregar/quitar -- caso del panel de anfitrión con "ver todos los
  // equipos", donde no hay un team_id único al que atribuir un marcador
  // nuevo.
  sessionId?: string;
  userId?: string;
}) {
  const initialCenter: [number, number] = restriction
    ? [restriction.lat, restriction.lng]
    : DEFAULT_CENTER;
  const [showDistanceLines, setShowDistanceLines] = useState(false);
  const [showTrails, setShowTrails] = useState(false);
  const { trails } = usePositionTrails(sessionId, showTrails);
  const [mapMode, setMapMode] = useState<"dark" | "topo" | "satellite">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusLabels, setStatusLabels] = useState<{ id: number; text: string; fading: boolean }[]>(
    []
  );
  const statusTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const statusIdRef = useRef(0);

  const { markers } = useMapMarkers(sessionId);
  const { addMarker, removeMarker } = useMapMarkerActions();
  const canEditMarkers = Boolean(sessionId && myTeamId && userId);
  const [pendingMarkerPoint, setPendingMarkerPoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [markerPendingDelete, setMarkerPendingDelete] = useState<MapMarker | null>(null);

  async function handleConfirmAddMarker(iconType: MapMarkerIconType, label: string) {
    if (!pendingMarkerPoint || !sessionId || !myTeamId || !userId) return;
    const ok = await addMarker({
      sessionId,
      teamId: myTeamId,
      userId,
      iconType,
      label,
      lat: pendingMarkerPoint.lat,
      lng: pendingMarkerPoint.lng,
    });
    setPendingMarkerPoint(null);
    if (ok) showStatus(`Marcador agregado: ${MAP_MARKER_LABELS[iconType]}`);
  }

  async function handleConfirmDeleteMarker() {
    if (!markerPendingDelete) return;
    const ok = await removeMarker(markerPendingDelete.id);
    setMarkerPendingDelete(null);
    if (ok) showStatus("Marcador eliminado");
  }

  // Fuerza un re-render cada 5s para que el tag de "hace X" (MAP-51) se
  // actualice con el correr del tiempo, aunque no llegue ninguna
  // posición nueva -- es justo el caso que tiene que detectar.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeouts = statusTimeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  function showStatus(label: string) {
    const id = statusIdRef.current++;
    setStatusLabels((prev) => [...prev, { id, text: label, fading: false }]);

    const fadeTimeout = setTimeout(() => {
      setStatusLabels((prev) =>
        prev.map((item) => (item.id === id ? { ...item, fading: true } : item))
      );
      const removeTimeout = setTimeout(() => {
        setStatusLabels((prev) => prev.filter((item) => item.id !== id));
        statusTimeoutsRef.current.delete(removeTimeout);
      }, STATUS_FADE_MS);
      statusTimeoutsRef.current.add(removeTimeout);
      statusTimeoutsRef.current.delete(fadeTimeout);
    }, STATUS_DISPLAY_MS);
    statusTimeoutsRef.current.add(fadeTimeout);
  }

  // El efecto secundario (showStatus) va afuera del updater de setState:
  // React StrictMode invoca dos veces las funciones updater en desarrollo
  // para detectar justamente este tipo de impureza, lo que duplicaba el
  // label en cada click (ver MAP-44).
  function toggleDistanceLines() {
    const next = !showDistanceLines;
    setShowDistanceLines(next);
    showStatus(`Mostrar distancias: ${next ? "ON" : "OFF"}`);
  }

  function toggleTrails() {
    const next = !showTrails;
    setShowTrails(next);
    showStatus(`Rastro de jugadores: ${next ? "ON" : "OFF"}`);
  }

  function cycleMapMode() {
    const next = mapMode === "dark" ? "topo" : mapMode === "topo" ? "satellite" : "dark";
    setMapMode(next);
    showStatus(`Vista: ${MAP_MODE_LABEL[next]}`);
  }

  function toggleFullscreen() {
    const next = !isFullscreen;
    setIsFullscreen(next);
    showStatus(`Fullscreen: ${next ? "ON" : "OFF"}`);
  }

  // Pseudo-fullscreen por CSS (ver FullscreenToggle) -- a diferencia de la
  // Fullscreen API nativa, Esc no lo cierra solo, hay que escucharlo a mano.
  useEffect(() => {
    if (!isFullscreen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      maxZoom={MAX_ZOOM}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      style={{ height: "70vh", width: "100%" }}
    >
      {mapMode === "topo" ? (
        <TileLayer
          key="topo"
          className="map-tiles-topo-dark"
          url={TOPO_URL}
          maxZoom={MAX_ZOOM}
          maxNativeZoom={TOPO_MAX_NATIVE_ZOOM}
          attribution={TOPO_ATTRIBUTION}
        />
      ) : mapMode === "satellite" ? (
        <TileLayer
          key="satellite"
          url={SATELLITE_URL}
          maxZoom={MAX_ZOOM}
          maxNativeZoom={SATELLITE_MAX_NATIVE_ZOOM}
          attribution={SATELLITE_ATTRIBUTION}
        />
      ) : (
        <TileLayer
          key="dark"
          className="map-tiles-hc"
          url={CARTO_DARK_URL}
          maxZoom={MAX_ZOOM}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
      )}
      {restriction ? (
        <>
          <FitToRestriction restriction={restriction} />
          <Circle
            center={[restriction.lat, restriction.lng]}
            radius={restriction.radiusM}
            pathOptions={{ color: "#F5A623", weight: 2, fillOpacity: 0.05 }}
          />
        </>
      ) : (
        <FitToPositions positions={positions} />
      )}
      {showDistanceLines && <DistanceLines positions={positions} />}
      {showTrails && (
        <PositionTrails trails={trails} myTeamId={myTeamId} teamColors={teamColors} />
      )}
      {positions.map((position) => (
        <Marker
          key={position.entityId}
          position={[position.lat, position.lng]}
          icon={playerMarkerIcon(
            position.nickname,
            position.role,
            isOutOfBounds(position, restriction),
            colorForTeam(position.teamId, myTeamId, teamColors),
            position.recordedAt
          )}
        />
      ))}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={mapMarkerIcon(marker.iconType, marker.label)}
          eventHandlers={
            canEditMarkers ? { click: () => setMarkerPendingDelete(marker) } : undefined
          }
        />
      ))}
      {canEditMarkers && <MarkerLongPress onLongPress={setPendingMarkerPoint} />}
      <MapModeClassSync mode={mapMode} />
      <CenterReticle />
      {/* La brújula "de verdad" vive arriba del panel de "Envío de posición"
          en PlayPage.tsx (no montada en el mapa) -- esta copia solo se ve
          en fullscreen, donde el resto de la página (sidebar incluido)
          queda tapado por el mapa (ver .map-pseudo-fullscreen). */}
      {isFullscreen && <Compass variant="overlay" />}
      <TacticalZoomControl positions={positions} restriction={restriction} />
      <DistanceLinesToggle enabled={showDistanceLines} onToggle={toggleDistanceLines} />
      <TrailToggle enabled={showTrails} onToggle={toggleTrails} />
      <MapModeToggle mode={mapMode} onToggle={cycleMapMode} />
      <FullscreenToggle isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      <RecenterButton
        className="top-3 right-14 bottom-auto left-auto"
        onPress={() => showStatus("Centrando en mi posición...")}
      />
      {statusLabels.length > 0 && (
        <div className="pointer-events-none absolute bottom-16 left-3 z-[1000] flex flex-col gap-1">
          {statusLabels.map((item) => (
            <div
              key={item.id}
              className={`text-xs font-bold tracking-[0.15em] text-white transition-opacity duration-300 ${
                item.fading ? "opacity-0" : "opacity-100"
              }`}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}
      {/* Adentro del MapContainer a propósito: el navegador oculta todo lo
          que no sea descendiente del elemento en fullscreen (ver
          FullscreenToggle) -- si estos diálogos quedan afuera, no se ven
          mientras el mapa está en pantalla completa (MAP-57). */}
      <MarkerCreateDialog
        open={pendingMarkerPoint !== null}
        onCancel={() => setPendingMarkerPoint(null)}
        onConfirm={handleConfirmAddMarker}
      />
      <ConfirmDialog
        open={markerPendingDelete !== null}
        title="Quitar marcador"
        message={`¿Quitar "${
          markerPendingDelete
            ? markerPendingDelete.label || MAP_MARKER_LABELS[markerPendingDelete.iconType]
            : ""
        }" del mapa?`}
        onConfirm={handleConfirmDeleteMarker}
        onCancel={() => setMarkerPendingDelete(null)}
      />
    </MapContainer>
  );
}

export default MapView;
