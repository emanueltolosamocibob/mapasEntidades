import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

type PlayerPosition = {
  entityId: string;
  nickname: string;
  teamColor: string | null;
  lat: number;
  lng: number;
};

const CARTO_VOYAGER_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

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
  }, [positions, map]);

  return null;
}

function MapView({ positions }: { positions: PlayerPosition[] }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={13}
      maxBoundsViscosity={1.0}
      style={{ height: "70vh", width: "100%" }}
    >
      <TileLayer
        url={CARTO_VOYAGER_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitToPositions positions={positions} />
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
    </MapContainer>
  );
}

export default MapView;
