import { useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";
import { cn } from "../lib/utils";

type Point = { lat: number; lng: number };

function RecenterButton({
  className,
  onLocate,
}: {
  className?: string;
  onLocate?: (point: Point) => void;
}) {
  const map = useMap();

  function handleClick() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      map.setView([point.lat, point.lng], map.getZoom());
      onLocate?.(point);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Centrar en mi posición"
      title="Centrar en mi posición"
      className={cn(
        "absolute bottom-3 left-3 z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10",
        className
      )}
    >
      <Crosshair className="h-4 w-4" />
    </button>
  );
}

export default RecenterButton;
