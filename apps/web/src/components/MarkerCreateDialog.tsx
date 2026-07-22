import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flag,
  HeartPulse,
  Home,
  ShieldAlert,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { MAP_MARKER_LABELS, type MapMarkerIconType } from "../lib/tacticalIcon";

const ICON_TYPE_OPTIONS: { type: MapMarkerIconType; Icon: typeof Home }[] = [
  { type: "friendly_base", Icon: Home },
  { type: "enemy_base", Icon: ShieldAlert },
  { type: "objective", Icon: Target },
  { type: "flag", Icon: Flag },
  { type: "arrow_up", Icon: ArrowUp },
  { type: "arrow_down", Icon: ArrowDown },
  { type: "arrow_left", Icon: ArrowLeft },
  { type: "arrow_right", Icon: ArrowRight },
  { type: "danger", Icon: TriangleAlert },
  { type: "rally_point", Icon: Users },
  { type: "help", Icon: HeartPulse },
];

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
    onConfirm(selectedType, label);
    setSelectedType(null);
    setLabel("");
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/80 p-4">
      <div className="relative w-full max-w-sm border border-primary bg-card p-6">
        <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
        <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
        <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
        <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

        <p className="mb-4 text-xs tracking-[0.2em] text-primary uppercase">Agregar marcador</p>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {ICON_TYPE_OPTIONS.map(({ type, Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              aria-pressed={selectedType === type}
              title={MAP_MARKER_LABELS[type]}
              className={`flex h-12 w-full items-center justify-center border ${
                selectedType === type
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:bg-primary/10"
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>

        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={selectedType ? MAP_MARKER_LABELS[selectedType] : "Etiqueta (opcional)"}
          maxLength={40}
          className="mb-6 w-full border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />

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
