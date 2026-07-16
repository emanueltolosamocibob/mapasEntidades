import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
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

function FitToPositions({ positions }: { positions: PlayerPosition[] }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (hasFitOnce.current || positions.length === 0) return;
    hasFitOnce.current = true;

    if (positions.length === 1) {
      map.setView([positions[0].lat, positions[0].lng], 16);
      return;
    }

    map.fitBounds(
      positions.map((position) => [position.lat, position.lng]),
      { padding: [40, 40] }
    );
  }, [positions, map]);

  return null;
}

function MapView({ positions }: { positions: PlayerPosition[] }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: "70vh", width: "100%" }}>
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
