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
import { Minus, Plus, Ruler } from "lucide-react";
import "leaflet/dist/leaflet.css";
import RecenterButton from "./RecenterButton";
import { playerMarkerIcon, distanceLabelIcon } from "../lib/tacticalIcon";

type PlayerPosition = {
  entityId: string;
  nickname: string;
  role: string;
  lat: number;
  lng: number;
  teamId?: string | null;
};

type Restriction = { lat: number; lng: number; radiusM: number };

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const MAX_ZOOM = 20;
const POSITIONS_FIT_PADDING: [number, number] = [40, 40];
const RESTRICTION_FIT_PADDING: [number, number] = [50, 50];

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
      <Ruler className="h-4 w-4" />
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

function MapView({
  positions,
  restriction,
  myTeamId,
}: {
  positions: PlayerPosition[];
  restriction: Restriction | null;
  // Si se pasa, los marcadores de un equipo distinto al propio se pintan
  // en rojo (replay con varios equipos a la vez). Sin este prop, el mapa
  // se comporta como siempre (uso en vivo, donde solo se ve el propio
  // equipo de todos modos).
  myTeamId?: string | null;
}) {
  const initialCenter: [number, number] = restriction
    ? [restriction.lat, restriction.lng]
    : DEFAULT_CENTER;
  const [showDistanceLines, setShowDistanceLines] = useState(false);

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      maxZoom={MAX_ZOOM}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      style={{ height: "70vh", width: "100%" }}
    >
      <TileLayer
        className="map-tiles-hc"
        url={CARTO_DARK_URL}
        maxZoom={MAX_ZOOM}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
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
            myTeamId != null && position.teamId != null && position.teamId !== myTeamId
          )}
        />
      ))}
      <TacticalZoomControl positions={positions} restriction={restriction} />
      <DistanceLinesToggle
        enabled={showDistanceLines}
        onToggle={() => setShowDistanceLines((prev) => !prev)}
      />
      <RecenterButton />
    </MapContainer>
  );
}

export default MapView;
