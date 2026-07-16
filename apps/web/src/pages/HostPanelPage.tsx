import { useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { usePendingParticipants } from "../hooks/usePendingParticipants";
import PendingRequestsList from "../components/PendingRequestsList";

function HostPanelPage() {
  const { code } = useParams<{ code: string }>();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId =
    sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const teams = useAirsoftTeams(sessionId);
  const { participants } = usePendingParticipants(sessionId);

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

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>
        Panel de anfitrión — {sessionByCode.session.name} ({code})
      </h1>
      <h2>Solicitudes pendientes</h2>
      <PendingRequestsList participants={participants} teams={teams} />
    </main>
  );
}

export default HostPanelPage;
