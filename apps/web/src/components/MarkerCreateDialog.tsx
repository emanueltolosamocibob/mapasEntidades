import { useState } from "react";
import { Button } from "./ui/button";
import {
  MAP_MARKER_LABELS,
  MAP_MARKER_SHAPE_SVG,
  isMovementMarker,
  type MapMarkerIconType,
} from "../lib/tacticalIcon";

const REFERENCE_TYPES: MapMarkerIconType[] = [
  "friendly_base",
  "enemy_base",
  "objective",
  "flag",
  "danger",
  "rally_point",
  "help",
];

// En orden horario arrancando en N, una al lado de la otra.
const MOVEMENT_TYPES: MapMarkerIconType[] = [
  "arrow_up",
  "arrow_up_right",
  "arrow_right",
  "arrow_down_right",
  "arrow_down",
  "arrow_down_left",
  "arrow_left",
  "arrow_up_left",
];

// Misma forma (MAP_MARKER_SHAPE_SVG) que dibuja mapMarkerIcon() para
// Leaflet -- una sola fuente de verdad, el botón se ve idéntico al
// marcador que termina puesto en el mapa.
function MarkerGlyph({ iconType }: { iconType: MapMarkerIconType }) {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-5 w-5"
      dangerouslySetInnerHTML={{ __html: MAP_MARKER_SHAPE_SVG[iconType] }}
    />
  );
}

function MarkerCreateDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (iconType: MapMarkerIconType, label: string) => void;
}) {
  const [selectedType, setSelectedType] = useState<MapMarkerIconType | null>(null);
  const [label, setLabel] = useState("");

  if (!open) return null;

  function handleCancel() {
    setSelectedType(null);
    setLabel("");
    onCancel();
  }

  function handleConfirm() {
    if (!selectedType) return;
    // Los marcadores de movimiento (flechas) son puramente direccionales,
    // nunca llevan tag sobre el mapa -- se ignora lo que haya en el input
    // aunque haya quedado cargado de una selección anterior.
    onConfirm(selectedType, isMovementMarker(selectedType) ? "" : label);
    setSelectedType(null);
    setLabel("");
  }

  function iconButtonClass(type: MapMarkerIconType) {
    return `flex h-12 w-full items-center justify-center border ${
      selectedType === type
        ? "border-primary bg-primary/20 text-primary"
        : "border-border text-muted-foreground hover:bg-primary/10"
    }`;
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/80 p-4">
      <div className="relative w-full max-w-sm border border-primary bg-card p-6">
        <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
        <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
        <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
        <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

        <p className="mb-4 text-xs tracking-[0.2em] text-primary uppercase">Agregar marcador</p>

        <p className="mb-1.5 text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
          Referencias
        </p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {REFERENCE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              aria-pressed={selectedType === type}
              title={MAP_MARKER_LABELS[type]}
              className={iconButtonClass(type)}
            >
              <MarkerGlyph iconType={type} />
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
          Movimiento
        </p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {MOVEMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              aria-pressed={selectedType === type}
              title={MAP_MARKER_LABELS[type]}
              className={iconButtonClass(type)}
            >
              <MarkerGlyph iconType={type} />
            </button>
          ))}
        </div>

        {selectedType && !isMovementMarker(selectedType) && (
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={MAP_MARKER_LABELS[selectedType]}
            maxLength={40}
            className="mb-6 w-full border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedType}>
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MarkerCreateDialog;
