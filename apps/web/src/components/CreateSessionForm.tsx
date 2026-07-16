import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useCreateSession } from "../hooks/useCreateSession";

function CreateSessionForm() {
  const [name, setName] = useState("");
  const [teams, setTeams] = useState(["Rojo", "Azul"]);
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
    const cleanTeams = teams.map((team) => team.trim()).filter(Boolean);
    if (!name.trim() || cleanTeams.length < 2) return;
    createSession(name.trim(), cleanTeams);
  }

  if (state.status === "success") {
    return (
      <div>
        <p>Sesión creada. Código de acceso:</p>
        <p style={{ fontSize: "2rem", fontWeight: "bold", letterSpacing: "0.1em" }}>
          {state.session.code}
        </p>
        <Link to={`/session/${state.session.code}/host`}>Ir al panel de anfitrión</Link>
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

      <button type="submit" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Creando..." : "Crear sesión"}
      </button>

      {state.status === "error" && (
        <p style={{ color: "crimson" }}>{state.message}</p>
      )}
    </form>
  );
}

export default CreateSessionForm;
