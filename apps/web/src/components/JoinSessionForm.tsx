import { useState, type FormEvent } from "react";
import { useJoinSession } from "../hooks/useJoinSession";

function JoinSessionForm() {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const { state, joinSession } = useJoinSession();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim() || !nickname.trim()) return;
    joinSession(code.trim().toUpperCase(), nickname.trim());
  }

  if (state.status === "pending") {
    return (
      <div>
        <p>
          Solicitud enviada como <strong>{state.participant.nickname}</strong>.
        </p>
        <p>Esperando que el anfitrión te acepte y te asigne un equipo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="join-code">Código de sesión</label>
        <br />
        <input
          id="join-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          style={{ textTransform: "uppercase" }}
          required
        />
      </div>
      <div>
        <label htmlFor="join-nickname">Nickname</label>
        <br />
        <input
          id="join-nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Enviando..." : "Unirse"}
      </button>
      {state.status === "error" && (
        <p style={{ color: "crimson" }}>{state.message}</p>
      )}
    </form>
  );
}

export default JoinSessionForm;
