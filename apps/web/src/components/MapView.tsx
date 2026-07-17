import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip, useMap } from "react-leaflet";
import { latLng, latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { originMarkerIcon } from "../lib/tacticalIcon";

type PlayerPosition = {
  entityId: string;
  nickname: string;
  teamColor: string | null;
  lat: number;
  lng: number;
};

type Restriction = { lat: number; lng: number; radiusM: number };

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const MAX_ZOOM = 20;

function boundsForPositions(positions: PlayerPosition[]) {
  if (positions.length === 1) {
    const { lat, lng } = positions[0];
    const delta = 0.004; // ~400m de margen para un solo jugador
    return latLngBounds([lat - delta, lng - delta], [lat + delta, lng + delta]);
  }
  return latLngBounds(positions.map((position) => [position.lat, position.lng]));
}

function FitToPositions({ positions }: { positions: PlayerPosition[] }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (hasFitOnce.current || positions.length === 0) return;
    hasFitOnce.current = true;

    const bounds = boundsForPositions(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
    // Limita el pan/zoom a la zona de la partida (+ margen), en vez de
    // dejar navegar el mapa mundial entero.
    map.setMaxBounds(bounds.pad(0.5));
    // Sin esto se puede alejar el zoom hasta cargar el mapa mundial completo.
    map.setMinZoom(map.getZoom());
  }, [positions, map]);

  return null;
}

function FitToRestriction({ restriction }: { restriction: Restriction }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (hasFitOnce.current) return;
    hasFitOnce.current = true;

    const bounds = latLng(restriction.lat, restriction.lng).toBounds(restriction.radiusM);

    map.fitBounds(bounds, { padding: [20, 20] });
    map.setMaxBounds(bounds.pad(0.2));
    // Sin esto se puede alejar el zoom hasta cargar el mapa mundial completo.
    map.setMinZoom(map.getZoom());
  }, [restriction, map]);

  return null;
}

function RecenterOnMe() {
  const map = useMap();

  function handleClick() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      map.setView([position.coords.latitude, position.coords.longitude], map.getZoom());
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute right-3 bottom-3 z-[1000] border border-primary bg-background/90 px-3 py-2 text-xs tracking-[0.15em] text-primary uppercase hover:bg-primary/10"
    >
      Centrar en mí
    </button>
  );
}

function MapView({
  positions,
  restriction,
}: {
  positions: PlayerPosition[];
  restriction: Restriction | null;
}) {
  const initialCenter: [number, number] = restriction
    ? [restriction.lat, restriction.lng]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      maxZoom={MAX_ZOOM}
      maxBoundsViscosity={1.0}
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
          <Marker
            position={[restriction.lat, restriction.lng]}
            icon={originMarkerIcon()}
          />
        </>
      ) : (
        <FitToPositions positions={positions} />
      )}
      {positions.map((position) => (
        <CircleMarker
          key={position.entityId}
          center={[position.lat, position.lng]}
          radius={8}
          pathOptions={{
            color: position.teamColor ?? "#333",
            fillColor: position.teamColor ?? "#333",
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            {position.nickname}
          </Tooltip>
        </CircleMarker>
      ))}
      <RecenterOnMe />
    </MapContainer>
  );
}

export default MapView;
