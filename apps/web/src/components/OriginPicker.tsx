import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import { latLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { originDotIcon, myLocationDotIcon } from "../lib/tacticalIcon";
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

function CenterOnMyLocation({ onLocate }: { onLocate: (point: Point) => void }) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !navigator.geolocation) return;
    done.current = true;
    navigator.geolocation.getCurrentPosition((position) => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      map.setView([point.lat, point.lng], map.getZoom());
      onLocate(point);
    });
  }, [map, onLocate]);

  return null;
}

function FitCircle({ center, radiusM }: { center: Point; radiusM: number }) {
  const map = useMap();
  // Ref en vez de dependencia: reencuadra cuando cambia el radio, pero no
  // cada vez que se clickea el mapa para mover el punto (eso no debe
  // recentrar la vista).
  const centerRef = useRef(center);
  centerRef.current = center;

  useEffect(() => {
    if (radiusM <= 0) return;
    const c = centerRef.current;
    const bounds = latLng(c.lat, c.lng).toBounds(radiusM * 2);
    map.fitBounds(bounds, { padding: [30, 30], animate: false });
  }, [radiusM, map]);

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
  const [myLocation, setMyLocation] = useState<Point | null>(null);

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
          {!value && <CenterOnMyLocation onLocate={setMyLocation} />}
          {myLocation && (
            <Marker position={[myLocation.lat, myLocation.lng]} icon={myLocationDotIcon()} />
          )}
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={originDotIcon()} />
              {radiusMeters > 0 && (
                <>
                  <FitCircle center={value} radiusM={radiusMeters} />
                  <Circle
                    center={[value.lat, value.lng]}
                    radius={radiusMeters}
                    pathOptions={{ color: "#F5A623", weight: 2, fillOpacity: 0.05 }}
                  />
                </>
              )}
            </>
          )}
          <RecenterButton onLocate={setMyLocation} />
        </MapContainer>
      </div>
    </div>
  );
}

export default OriginPicker;
