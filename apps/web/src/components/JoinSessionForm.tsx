import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useJoinSession } from "../hooks/useJoinSession";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useSession } from "../contexts/SessionContext";

function JoinSessionForm() {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [joinedCode, setJoinedCode] = useState("");
  const { state, joinSession } = useJoinSession();
  const session = useSession();
  const navigate = useNavigate();

  const userId = session.status === "ready" ? session.user.id : undefined;
  const sessionId =
    state.status === "pending" ? state.participant.session_id : undefined;
  const myParticipant = useMyParticipant(sessionId, userId);

  useEffect(() => {
    if (myParticipant?.status === "accepted") {
      navigate(`/session/${joinedCode}/play`);
    }
  }, [myParticipant?.status, joinedCode, navigate]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim() || !nickname.trim()) return;
    const normalizedCode = code.trim().toUpperCase();
    setJoinedCode(normalizedCode);
    joinSession(normalizedCode, nickname.trim());
  }

  if (state.status === "pending") {
    if (myParticipant?.status === "rejected") {
      return (
        <div>
          <p>
            Tu solicitud para unirte como <strong>{state.participant.nickname}</strong> fue
            rechazada por el anfitrión.
          </p>
        </div>
      );
    }

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
