import type { ReactNode } from "react";
import { useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { useParticipants } from "../hooks/useParticipants";
import { useCloseSession } from "../hooks/useCloseSession";
import { isSessionClosed } from "../lib/sessionStatus";
import { Button } from "../components/ui/button";
import PendingRequestsList from "../components/PendingRequestsList";
import AcceptedParticipantsList from "../components/AcceptedParticipantsList";
import SessionCodeQr from "../components/SessionCodeQr";
import TacticalPanel from "../components/TacticalPanel";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-8 text-center text-sm text-muted-foreground">
      {children}
    </main>
  );
}

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
    return <CenteredMessage>Cargando sesión...</CenteredMessage>;
  }

  if (sessionByCode.status === "not-found") {
    return <CenteredMessage>Sesión no encontrada (o no tenés permiso para verla).</CenteredMessage>;
  }

  if (sessionByCode.status === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm text-destructive">
        {sessionByCode.message}
      </main>
    );
  }

  const isHost =
    session.status === "ready" && session.user.id === sessionByCode.session.host_id;

  if (!isHost) {
    return <CenteredMessage>No sos el anfitrión de esta sesión.</CenteredMessage>;
  }

  const pendingParticipants = participants.filter((p) => p.status === "pending");
  const acceptedParticipants = participants.filter((p) => p.status === "accepted");
  const isClosed = isSessionClosed(sessionByCode.session);

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Panel de anfitrión
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {sessionByCode.session.name}{" "}
              <span className="text-primary">({code})</span>
            </h1>

            <div className="mt-4">
              {isClosed ? (
                <p className="text-sm text-muted-foreground">Esta sesión está cerrada.</p>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={closing}
                  onClick={() => closeSession(sessionByCode.session.id)}
                >
                  {closing ? "Cerrando..." : "Cerrar sesión"}
                </Button>
              )}
              {closeError && <p className="mt-2 text-sm text-destructive">{closeError}</p>}
            </div>
          </div>

          {!isClosed && code && <SessionCodeQr code={code} size={120} />}
        </header>

        <div className="space-y-6">
          <TacticalPanel title="Solicitudes pendientes">
            <PendingRequestsList participants={pendingParticipants} teams={teams} />
          </TacticalPanel>

          <TacticalPanel title="Jugadores aceptados">
            <AcceptedParticipantsList participants={acceptedParticipants} teams={teams} />
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default HostPanelPage;
