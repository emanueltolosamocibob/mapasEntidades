import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useCreateSession } from "../hooks/useCreateSession";
import OriginPicker from "./OriginPicker";
import SessionCodeQr from "./SessionCodeQr";

type Point = { lat: number; lng: number };
type MovementMode = "free" | "restricted";

function CreateSessionForm() {
  const [name, setName] = useState("");
  const [teams, setTeams] = useState(["Rojo", "Azul"]);
  const [origin, setOrigin] = useState<Point | null>(null);
  const [movementMode, setMovementMode] = useState<MovementMode>("free");
  const [radiusMeters, setRadiusMeters] = useState("300");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { state, createSession } = useCreateSession();

  function updateTeam(index: number, value: string) {
    setTeams((prev) => prev.map((team, i) => (i === index ? value : team)));
  }

  function addTeam() {
    setTeams((prev) => [...prev, ""]);
  }

  function removeTeam(index: number) {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);

    const cleanTeams = teams.map((team) => team.trim()).filter(Boolean);
    if (!name.trim() || cleanTeams.length < 2) return;

    if (movementMode === "restricted") {
      const radius = Number(radiusMeters);
      if (!origin) {
        setValidationError("Marcá un punto de partida en el mapa para restringir el movimiento.");
        return;
      }
      if (!Number.isFinite(radius) || radius <= 0) {
        setValidationError("El radio tiene que ser un número mayor a 0.");
        return;
      }
      createSession(name.trim(), cleanTeams, origin, radius);
      return;
    }

    createSession(name.trim(), cleanTeams, origin, null);
  }

  if (state.status === "success") {
    return (
      <div>
        <p>Sesión creada. Código de acceso:</p>
        <p style={{ fontSize: "2rem", fontWeight: "bold", letterSpacing: "0.1em" }}>
          {state.session.code}
        </p>
        <SessionCodeQr code={state.session.code} />
        <p>
          <Link to={`/session/${state.session.code}/host`}>Ir al panel de anfitrión</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="session-name">Nombre de la partida</label>
        <br />
        <input
          id="session-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <fieldset>
        <legend>Equipos (mínimo 2)</legend>
        {teams.map((team, index) => (
          <div key={index}>
            <input
              value={team}
              onChange={(event) => updateTeam(index, event.target.value)}
              placeholder={`Equipo ${index + 1}`}
              required
            />
            {teams.length > 2 && (
              <button type="button" onClick={() => removeTeam(index)}>
                Quitar
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addTeam}>
          + Agregar equipo
        </button>
      </fieldset>

      <fieldset>
        <legend>Punto de partida y movimiento</legend>
        <OriginPicker value={origin} onChange={setOrigin} />

        <label>
          <input
            type="radio"
            name="movement-mode"
            checked={movementMode === "free"}
            onChange={() => setMovementMode("free")}
          />
          Movimiento libre
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="movement-mode"
            checked={movementMode === "restricted"}
            onChange={() => setMovementMode("restricted")}
          />
          Restringir a
          <input
            type="number"
            min={1}
            value={radiusMeters}
            disabled={movementMode !== "restricted"}
            onChange={(event) => setRadiusMeters(event.target.value)}
            style={{ width: "5rem", margin: "0 0.3rem" }}
          />
          metros a la redonda del punto marcado
        </label>
      </fieldset>

      <button type="submit" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Creando..." : "Crear sesión"}
      </button>

      {validationError && <p style={{ color: "crimson" }}>{validationError}</p>}
      {state.status === "error" && (
        <p style={{ color: "crimson" }}>{state.message}</p>
      )}
    </form>
  );
}

export default CreateSessionForm;
