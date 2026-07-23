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
import SessionPhotosPanel from "./SessionPhotosPanel";

type Point = { lat: number; lng: number };
type MovementMode = "free" | "restricted";
type TeamDraft = { name: string; maxPlayers: string };

const MAX_TEAMS = 10;
const RADIUS_MIN = 100;
const RADIUS_MAX = 10000;

const textareaClassName =
  "min-h-24 w-full border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring";

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

function PublishEventForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teams, setTeams] = useState<TeamDraft[]>([{ name: "Equipo 1", maxPlayers: "" }]);
  const [origin, setOrigin] = useState<Point | null>(null);
  const [movementMode, setMovementMode] = useState<MovementMode>("free");
  const [radiusMeters, setRadiusMeters] = useState("300");
  const [nameError, setNameError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { state, createSession } = useCreateSession();
  const presetFields = usePresetFields();
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [focusSignal, setFocusSignal] = useState(0);

  function updateTeamName(index: number, value: string) {
    setTeams((prev) => prev.map((team, i) => (i === index ? { ...team, name: value } : team)));
  }

  function updateTeamMaxPlayers(index: number, value: string) {
    setTeams((prev) =>
      prev.map((team, i) => (i === index ? { ...team, maxPlayers: value } : team))
    );
  }

  function addTeam() {
    setTeams((prev) =>
      prev.length >= MAX_TEAMS ? prev : [...prev, { name: "", maxPlayers: "" }]
    );
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

    const cleanTeams = teams
      .map((team) => ({ name: team.name.trim(), maxPlayers: team.maxPlayers.trim() }))
      .filter((team) => team.name);
    let hasError = false;

    if (!name.trim()) {
      setNameError("Ingresá un nombre válido.");
      hasError = true;
    }
    if (cleanTeams.length < 1) {
      setTeamsError("Ingresá al menos 1 equipo con nombre.");
      hasError = true;
    }
    for (const team of cleanTeams) {
      if (team.maxPlayers && (!Number.isFinite(Number(team.maxPlayers)) || Number(team.maxPlayers) < 1)) {
        setTeamsError(`El cupo de "${team.name}" tiene que ser un número mayor a 0.`);
        hasError = true;
      }
    }
    if (hasError) return;

    const teamsForSubmit = cleanTeams.map((team) => ({
      name: team.name,
      maxPlayers: team.maxPlayers ? Number(team.maxPlayers) : null,
    }));

    if (movementMode === "restricted") {
      const radius = Number(radiusMeters);
      if (!origin) {
        setValidationError("Marcá un punto de partida en el mapa para restringir el movimiento.");
        return;
      }
      if (!Number.isFinite(radius) || radius < RADIUS_MIN || radius > RADIUS_MAX) {
        setValidationError(`El radio tiene que estar entre ${RADIUS_MIN} y ${RADIUS_MAX} metros.`);
        return;
      }
      createSession({
        name: name.trim(),
        teams: teamsForSubmit,
        origin,
        movementRadiusM: radius,
        description: description.trim() || null,
        startNow: false,
      });
      return;
    }

    createSession({
      name: name.trim(),
      teams: teamsForSubmit,
      origin,
      movementRadiusM: null,
      description: description.trim() || null,
      startNow: false,
    });
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Evento publicado — código de acceso
        </p>
        <p className="text-3xl font-bold tracking-[0.15em] text-primary">{state.session.code}</p>
        <SessionCodeQr code={state.session.code} />

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Fotos del evento
          </p>
          <SessionPhotosPanel sessionId={state.session.id} />
        </div>

        <Link
          to={`/session/${state.session.code}/host`}
          className="block text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          Ir al panel de anfitrión →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="event-name" className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Nombre del evento
        </Label>
        <Input id="event-name" value={name} onChange={(event) => setName(event.target.value)} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="event-description"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Descripción
        </Label>
        <textarea
          id="event-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Contales a los jugadores de qué se trata el evento..."
          className={textareaClassName}
        />
      </div>

      <div>
        <SectionLabel>Equipos (mínimo 1)</SectionLabel>
        <div className="space-y-2">
          {teams.map((team, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={team.name}
                onChange={(event) => updateTeamName(index, event.target.value)}
                placeholder={`Equipo ${index + 1}`}
              />
              <Input
                type="number"
                min={1}
                value={team.maxPlayers}
                onChange={(event) => updateTeamMaxPlayers(index, event.target.value)}
                placeholder="Cupo"
                className="w-24"
              />
              {teams.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeTeam(index)}>
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Cupo vacío = sin límite de jugadores en ese equipo.
        </p>
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
            <ModeOption active={movementMode === "restricted"} onClick={() => setMovementMode("restricted")}>
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
                      if (field) {
                        setOrigin({ lat: field.lat, lng: field.lng });
                        setFocusSignal((n) => n + 1);
                      }
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
                focusSignal={focusSignal}
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
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={state.status === "loading"} className="w-full">
        {state.status === "loading" ? "Publicando..." : "Publicar evento"}
      </Button>
    </form>
  );
}

export default PublishEventForm;
