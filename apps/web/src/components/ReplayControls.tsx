import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export type VisibilityMode = "all" | "team" | "me";

const SPEED_OPTIONS = [1, 2, 4, 8];

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function ModeOption({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex-1 border px-3 py-2 text-xs tracking-[0.15em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ReplayControls({
  startTime,
  endTime,
  currentTime,
  isPlaying,
  onToggle,
  onSeek,
  onSpeedChange,
  visibilityMode,
  onVisibilityModeChange,
  hasTeam,
  hasSelf,
}: {
  startTime: number;
  endTime: number;
  currentTime: number;
  isPlaying: boolean;
  onToggle: () => void;
  onSeek: (t: number) => void;
  onSpeedChange: (speed: number) => void;
  visibilityMode: VisibilityMode;
  onVisibilityModeChange: (mode: VisibilityMode) => void;
  hasTeam: boolean;
  hasSelf: boolean;
}) {
  const [speed, setSpeed] = useState(1);
  const hasData = endTime > startTime;
  const elapsed = currentTime - startTime;
  const total = endTime - startTime;

  function handleSpeedChange(value: number) {
    setSpeed(value);
    onSpeedChange(value);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={!hasData}
            onClick={onToggle}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <input
            type="range"
            min={startTime}
            max={endTime}
            value={currentTime}
            disabled={!hasData}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="tactical-slider flex-1"
          />
          <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            {formatDuration(elapsed)} / {formatDuration(total)}
          </span>
        </div>
        {!hasData && (
          <p className="mt-2 text-xs text-muted-foreground">
            Esta partida no tiene registros de posición para reproducir.
          </p>
        )}
        {hasData && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
              Velocidad
            </span>
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSpeedChange(option)}
                className={cn(
                  "border px-2 py-1 text-xs uppercase transition-colors",
                  speed === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                )}
              >
                {option}x
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <ModeOption active={visibilityMode === "all"} onClick={() => onVisibilityModeChange("all")}>
          Todos los equipos
        </ModeOption>
        <ModeOption
          active={visibilityMode === "team"}
          disabled={!hasTeam}
          onClick={() => onVisibilityModeChange("team")}
        >
          Mi equipo
        </ModeOption>
        <ModeOption
          active={visibilityMode === "me"}
          disabled={!hasSelf}
          onClick={() => onVisibilityModeChange("me")}
        >
          Solo yo
        </ModeOption>
      </div>
    </div>
  );
}

export default ReplayControls;
