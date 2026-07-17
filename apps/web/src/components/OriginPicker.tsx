import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { originMarkerIcon } from "../lib/tacticalIcon";

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

type Point = { lat: number; lng: number };

function ClickToPlace({ onPick }: { onPick: (point: Point) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function OriginPicker({
  value,
  onChange,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Tocá el mapa para marcar el punto de partida
        {value ? "" : " (todavía no marcaste ninguno)"}.
      </p>
      <div className="h-60 border border-border">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            className="map-tiles-hc"
            url={CARTO_DARK_URL}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <ClickToPlace onPick={onChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={originMarkerIcon()} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default OriginPicker;
