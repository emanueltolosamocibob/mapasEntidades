import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { originMarkerIcon } from "../lib/tacticalIcon";
import RecenterButton from "./RecenterButton";

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

function CenterOnMyLocation() {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !navigator.geolocation) return;
    done.current = true;
    navigator.geolocation.getCurrentPosition((position) => {
      map.setView([position.coords.latitude, position.coords.longitude], map.getZoom());
    });
  }, [map]);

  return null;
}

function OriginPicker({
  value,
  onChange,
  radiusMeters,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
  radiusMeters: number;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Tocá el mapa para marcar el punto de partida
        {value ? "" : " (todavía no marcaste ninguno)"}.
      </p>
      <div className="relative h-60 border border-border">
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
          {!value && <CenterOnMyLocation />}
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={originMarkerIcon()} />
              {radiusMeters > 0 && (
                <Circle
                  center={[value.lat, value.lng]}
                  radius={radiusMeters}
                  pathOptions={{ color: "#F5A623", weight: 2, fillOpacity: 0.05 }}
                />
              )}
            </>
          )}
          <RecenterButton />
        </MapContainer>
      </div>
    </div>
  );
}

export default OriginPicker;
