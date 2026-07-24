import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import { latLng, DomEvent } from "leaflet";
import { Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { originDotIcon, myLocationTaggedIcon } from "../lib/tacticalIcon";
import RecenterButton from "./RecenterButton";
import { cn } from "../lib/utils";

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

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

// Recentra el mapa cuando "signal" cambia (ej. se eligió un campo
// predefinido) — a diferencia de FitCircle, esto ignora los cambios de
// "point" en sí (un click en el mapa no debe disparar esto).
function FlyToPoint({ point, signal }: { point: Point; signal: number }) {
  const map = useMap();
  const pointRef = useRef(point);
  pointRef.current = point;

  useEffect(() => {
    if (signal === 0) return;
    const p = pointRef.current;
    map.setView([p.lat, p.lng], map.getZoom());
  }, [signal, map]);

  return null;
}

function SatelliteToggleButton({
  active,
  onToggle,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Mismo motivo que en RecenterButton -- sin esto el click atraviesa al
  // mapa por debajo y dispara el click-to-place del origen.
  useEffect(() => {
    if (buttonRef.current) DomEvent.disableClickPropagation(buttonRef.current);
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-label={active ? "Ver mapa normal" : "Ver vista satelital"}
      title={active ? "Ver mapa normal" : "Ver vista satelital"}
      className={cn(
        "absolute z-[1000] flex h-9 w-9 items-center justify-center border bg-background/90 hover:bg-primary/10",
        active ? "border-primary text-primary" : "border-border text-muted-foreground",
        className
      )}
    >
      <Layers className="h-4 w-4" />
    </button>
  );
}

function OriginPicker({
  value,
  onChange,
  radiusMeters,
  focusSignal = 0,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
  radiusMeters: number;
  focusSignal?: number;
}) {
  const [myLocation, setMyLocation] = useState<Point | null>(null);
  const [satellite, setSatellite] = useState(false);

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Tocá el mapa para marcar el punto de partida.
      </p>
      <div className="relative h-60 border border-border">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          {satellite ? (
            <TileLayer
              url={SATELLITE_URL}
              attribution="Tiles &copy; Esri"
            />
          ) : (
            <TileLayer
              className="map-tiles-hc"
              url={CARTO_DARK_URL}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          )}
          <ClickToPlace onPick={onChange} />
          {!value && <CenterOnMyLocation onLocate={setMyLocation} />}
          {myLocation && (
            <Marker position={[myLocation.lat, myLocation.lng]} icon={myLocationTaggedIcon()} />
          )}
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={originDotIcon()} />
              <FlyToPoint point={value} signal={focusSignal} />
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
          <RecenterButton onLocate={setMyLocation} className="top-3 right-3 bottom-auto left-auto" />
          <SatelliteToggleButton
            active={satellite}
            onToggle={() => setSatellite((current) => !current)}
            className="top-14 right-3 bottom-auto left-auto"
          />
        </MapContainer>
      </div>
    </div>
  );
}

export default OriginPicker;
