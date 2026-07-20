import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useCreateSession } from "../hooks/useCreateSession";
import { usePresetFields } from "../hooks/usePresetFields";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import OriginPicker from "./OriginPicker";
import SessionCodeQr from "./SessionCodeQr";

type Point = { lat: number; lng: number };
type MovementMode = "free" | "restricted";

const MAX_TEAMS = 10;
const RADIUS_MIN = 100;
const RADIUS_MAX = 10000;

const selectClassName =
  "h-9 w-full border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring disabled:opacity-50";

// Los <option> de un <select> nativo no heredan los colores de Tailwind/CSS
// vars del <select> en todos los navegadores — hay que fijarlos a mano.
const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground uppercase">
      <span className="h-1 w-1 bg-muted-foreground" />
      {children}
    </p>
  );
}

function ModeOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 border px-3 py-2 text-xs tracking-[0.15em] uppercase transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function CreateSessionForm() {
  const [name, setName] = useState("");
  const [teams, setTeams] = useState(["Rojo", "Azul"]);
  const [origin, setOrigin] = useState<Point | null>(null);
  const [movementMode, setMovementMode] = useState<MovementMode>("free");
  const [radiusMeters, setRadiusMeters] = useState("300");
  const [nameError, setNameError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { state, createSession } = useCreateSession();
  const presetFields = usePresetFields();
  const [selectedFieldId, setSelectedFieldId] = useState("");

  function updateTeam(index: number, value: string) {
    setTeams((prev) => prev.map((team, i) => (i === index ? value : team)));
  }

  function addTeam() {
    setTeams((prev) => (prev.length >= MAX_TEAMS ? prev : [...prev, ""]));
  }

  function removeTeam(index: number) {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRadiusBlur() {
    const radius = Number(radiusMeters);
    if (!Number.isFinite(radius) || radius < RADIUS_MIN || radius > RADIUS_MAX) {
      setValidationError(`El radio tiene que estar entre ${RADIUS_MIN} y ${RADIUS_MAX} metros.`);
    } else {
      setValidationError(null);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    setNameError(null);
    setTeamsError(null);

    const cleanTeams = teams.map((team) => team.trim()).filter(Boolean);
    let hasError = false;

    if (!name.trim()) {
      setNameError("Ingresá un nombre válido.");
      hasError = true;
    }
    if (cleanTeams.length < 2) {
      setTeamsError("Ingresá al menos 2 equipos con nombre.");
      hasError = true;
    }
    if (hasError) return;

    if (movementMode === "restricted") {
      const radius = Number(radiusMeters);
      if (!origin) {
        setValidationError("Marcá un punto de partida en el mapa para restringir el movimiento.");
        return;
      }
      if (!Number.isFinite(radius) || radius < RADIUS_MIN || radius > RADIUS_MAX) {
        setValidationError(
          `El radio tiene que estar entre ${RADIUS_MIN} y ${RADIUS_MAX} metros.`
        );
        return;
      }
      createSession(name.trim(), cleanTeams, origin, radius);
      return;
    }

    createSession(name.trim(), cleanTeams, origin, null);
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Partida creada — código de acceso
        </p>
        <p className="text-3xl font-bold tracking-[0.15em] text-primary">
          {state.session.code}
        </p>
        <SessionCodeQr code={state.session.code} />
        <Link
          to={`/session/${state.session.code}/host`}
          className="inline-block text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          Ir al panel de anfitrión →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <Label
          htmlFor="session-name"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Nombre de la partida
        </Label>
        <Input id="session-name" value={name} onChange={(event) => setName(event.target.value)} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div>
        <SectionLabel>Equipos (mínimo 2)</SectionLabel>
        <div className="space-y-2">
          {teams.map((team, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={team}
                onChange={(event) => updateTeam(index, event.target.value)}
                placeholder={`Equipo ${index + 1}`}
              />
              {teams.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeam(index)}
                >
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        {teamsError && <p className="mt-1 text-xs text-destructive">{teamsError}</p>}
        {teams.length >= MAX_TEAMS ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Alcanzaste el máximo de {MAX_TEAMS} equipos.
          </p>
        ) : (
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addTeam}>
            + Agregar equipo
          </Button>
        )}
      </div>

      <div>
        <SectionLabel>Punto de partida y movimiento</SectionLabel>
        <div className="space-y-3">
          <div className="flex gap-2">
            <ModeOption
              active={movementMode === "free"}
              onClick={() => {
                setMovementMode("free");
                setOrigin(null);
                setSelectedFieldId("");
              }}
            >
              Movimiento libre
            </ModeOption>
            <ModeOption
              active={movementMode === "restricted"}
              onClick={() => setMovementMode("restricted")}
            >
              Restringir radio
            </ModeOption>
          </div>

          {movementMode === "restricted" && (
            <>
              {presetFields.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                    Campo predefinido
                  </Label>
                  <select
                    className={selectClassName}
                    value={selectedFieldId}
                    onChange={(event) => {
                      const field = presetFields.find((f) => f.id === event.target.value);
                      setSelectedFieldId(event.target.value);
                      if (field) setOrigin({ lat: field.lat, lng: field.lng });
                    }}
                  >
                    <option value="" disabled style={optionStyle}>
                      Elegir campo
                    </option>
                    {presetFields.map((field) => (
                      <option key={field.id} value={field.id} style={optionStyle}>
                        {field.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <OriginPicker
                value={origin}
                onChange={(point) => {
                  setSelectedFieldId("");
                  setOrigin(point);
                }}
                radiusMeters={
                  Number(radiusMeters) > 0
                    ? Math.min(Math.max(Number(radiusMeters), RADIUS_MIN), RADIUS_MAX)
                    : 0
                }
              />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Restringir a</span>
                <Input
                  type="number"
                  min={RADIUS_MIN}
                  max={RADIUS_MAX}
                  value={radiusMeters}
                  onChange={(event) => setRadiusMeters(event.target.value)}
                  onBlur={handleRadiusBlur}
                  className="w-24"
                />
                <span className="text-muted-foreground">metros</span>
              </div>
            </>
          )}
        </div>
      </div>

      {validationError && <p className="text-sm text-destructive">{validationError}</p>}
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" disabled={state.status === "loading"} className="w-full">
        {state.status === "loading" ? "Creando..." : "Crear partida"}
      </Button>
    </form>
  );
}

export default CreateSessionForm;
