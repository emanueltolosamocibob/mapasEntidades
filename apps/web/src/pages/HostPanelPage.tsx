import { useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { useParticipants } from "../hooks/useParticipants";
import { useCloseSession } from "../hooks/useCloseSession";
import PendingRequestsList from "../components/PendingRequestsList";
import AcceptedParticipantsList from "../components/AcceptedParticipantsList";

function HostPanelPage() {
  const { code } = useParams<{ code: string }>();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId =
    sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const teams = useAirsoftTeams(sessionId);
  const { participants } = useParticipants(sessionId);
  const { closeSession, loading: closing, error: closeError } = useCloseSession();

  if (sessionByCode.status === "loading") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p>Cargando sesión...</p>
      </main>
    );
  }

  if (sessionByCode.status === "not-found") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p>Sesión no encontrada (o no tenés permiso para verla).</p>
      </main>
    );
  }

  if (sessionByCode.status === "error") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p style={{ color: "crimson" }}>{sessionByCode.message}</p>
      </main>
    );
  }

  const isHost =
    session.status === "ready" && session.user.id === sessionByCode.session.host_id;

  if (!isHost) {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p>No sos el anfitrión de esta sesión.</p>
      </main>
    );
  }

  const pendingParticipants = participants.filter((p) => p.status === "pending");
  const acceptedParticipants = participants.filter((p) => p.status === "accepted");
  const isClosed = sessionByCode.session.status === "closed";

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>
        Panel de anfitrión — {sessionByCode.session.name} ({code})
      </h1>

      {isClosed ? (
        <p>Esta sesión está cerrada.</p>
      ) : (
        <button
          type="button"
          disabled={closing}
          onClick={() => closeSession(sessionByCode.session.id)}
        >
          {closing ? "Cerrando..." : "Cerrar sesión"}
        </button>
      )}
      {closeError && <p style={{ color: "crimson" }}>{closeError}</p>}

      <h2>Solicitudes pendientes</h2>
      <PendingRequestsList participants={pendingParticipants} teams={teams} />

      <h2>Jugadores aceptados</h2>
      <AcceptedParticipantsList participants={acceptedParticipants} teams={teams} />
    </main>
  );
}

export default HostPanelPage;
