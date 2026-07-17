import { useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";
import { cn } from "../lib/utils";

function RecenterButton({ className }: { className?: string }) {
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
      aria-label="Centrar en mi posición"
      title="Centrar en mi posición"
      className={cn(
        "absolute right-3 bottom-3 z-[1000] flex h-9 w-9 items-center justify-center border border-primary bg-background/90 text-primary hover:bg-primary/10",
        className
      )}
    >
      <Crosshair className="h-4 w-4" />
    </button>
  );
}

export default RecenterButton;
