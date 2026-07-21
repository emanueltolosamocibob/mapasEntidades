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
import { latLng, latLngBounds, point, type LatLngBounds } from "leaflet";
import { Minus, Mountain, Plus, Waypoints } from "lucide-react";
import "leaflet/dist/leaflet.css";
import RecenterButton from "./RecenterButton";
import { playerMarkerIcon, distanceLabelIcon, ENEMY_COLOR } from "../lib/tacticalIcon";

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

function TopoToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="Mapa topográfico"
      title="Mapa topográfico"
      className={`absolute top-3 right-[100px] z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10 ${
        enabled ? "bg-primary/20" : ""
      }`}
    >
      <Mountain className="h-4 w-4" />
    </button>
  );
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

  useEffect(() => setZoom(map.getZoom()), [positions, restriction, map]);

  // Zoom manual (botones +/- de acá abajo) dispara 'zoomend' normal.
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
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
    <div className="absolute top-3 left-3 z-[1000] flex items-center border border-primary bg-background/90 text-primary">
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
  );
}

function markerColorFor(
  position: PlayerPosition,
  myTeamId: string | null | undefined,
  teamColors: Record<string, string> | undefined
): string | undefined {
  if (teamColors && position.teamId && teamColors[position.teamId]) {
    return teamColors[position.teamId];
  }
  if (myTeamId != null && position.teamId != null && position.teamId !== myTeamId) {
    return ENEMY_COLOR;
  }
  return undefined;
}

function MapView({
  positions,
  restriction,
  myTeamId,
  teamColors,
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
}) {
  const initialCenter: [number, number] = restriction
    ? [restriction.lat, restriction.lng]
    : DEFAULT_CENTER;
  const [showDistanceLines, setShowDistanceLines] = useState(false);
  const [showTopo, setShowTopo] = useState(false);
  const [statusLabels, setStatusLabels] = useState<{ id: number; text: string; fading: boolean }[]>(
    []
  );
  const statusTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const statusIdRef = useRef(0);

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

  function toggleTopo() {
    const next = !showTopo;
    setShowTopo(next);
    showStatus(`Vista topográfica: ${next ? "ON" : "OFF"}`);
  }

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      maxZoom={MAX_ZOOM}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      style={{ height: "70vh", width: "100%" }}
    >
      {showTopo ? (
        <TileLayer
          key="topo"
          url={TOPO_URL}
          maxZoom={MAX_ZOOM}
          maxNativeZoom={TOPO_MAX_NATIVE_ZOOM}
          attribution={TOPO_ATTRIBUTION}
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
      {positions.map((position) => (
        <Marker
          key={position.entityId}
          position={[position.lat, position.lng]}
          icon={playerMarkerIcon(
            position.nickname,
            position.role,
            isOutOfBounds(position, restriction),
            markerColorFor(position, myTeamId, teamColors),
            position.recordedAt
          )}
        />
      ))}
      <TacticalZoomControl positions={positions} restriction={restriction} />
      <DistanceLinesToggle enabled={showDistanceLines} onToggle={toggleDistanceLines} />
      <TopoToggle enabled={showTopo} onToggle={toggleTopo} />
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
    </MapContainer>
  );
}

export default MapView;
