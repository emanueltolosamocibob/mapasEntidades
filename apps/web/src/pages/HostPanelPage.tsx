import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { useParticipants } from "../hooks/useParticipants";
import { useCloseSession } from "../hooks/useCloseSession";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { usePositions } from "../hooks/usePositions";
import { isSessionClosed } from "../lib/sessionStatus";
import { buildTeamColorMap } from "../lib/teamColors";
import { Button } from "../components/ui/button";
import PendingRequestsList from "../components/PendingRequestsList";
import AcceptedParticipantsList from "../components/AcceptedParticipantsList";
import SessionCodeQr from "../components/SessionCodeQr";
import TacticalPanel from "../components/TacticalPanel";
import ConfirmDialog from "../components/ConfirmDialog";
import HostJoinForm from "../components/HostJoinForm";
import MapView from "../components/MapView";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-8 text-center text-sm text-muted-foreground">
      {children}
    </main>
  );
}

function HostPanelPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId =
    sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const teams = useAirsoftTeams(sessionId);
  const { participants } = useParticipants(sessionId);
  const { closeSession, loading: closing, error: closeError } = useCloseSession();
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const userId = session.status === "ready" ? session.user.id : undefined;
  const myParticipant = useMyParticipant(sessionId, userId);
  const { positions } = usePositions(sessionId);
  const [showMap, setShowMap] = useState(false);
  const teamColors = useMemo(() => buildTeamColorMap(teams.map((t) => t.id)), [teams]);

  if (sessionByCode.status === "loading") {
    return <CenteredMessage>Cargando partida...</CenteredMessage>;
  }

  if (sessionByCode.status === "not-found") {
    return <CenteredMessage>Partida no encontrada (o no tenés permiso para verla).</CenteredMessage>;
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
    return <CenteredMessage>No sos el anfitrión de esta partida.</CenteredMessage>;
  }

  const pendingParticipants = participants.filter((p) => p.status === "pending");
  const acceptedParticipants = participants.filter((p) => p.status === "accepted");
  const isClosed = isSessionClosed(sessionByCode.session);
  const currentSessionId = sessionByCode.session.id;

  const positionsWithTeam = positions.map((position) => ({
    ...position,
    teamId: participants.find((p) => p.entity_id === position.entityId)?.team_id ?? null,
  }));

  const restriction =
    sessionByCode.session.origin_lat !== null &&
    sessionByCode.session.origin_lng !== null &&
    sessionByCode.session.movement_radius_m !== null
      ? {
          lat: sessionByCode.session.origin_lat,
          lng: sessionByCode.session.origin_lng,
          radiusM: sessionByCode.session.movement_radius_m,
        }
      : null;

  async function confirmCloseSession() {
    setConfirmCloseOpen(false);
    const success = await closeSession(currentSessionId);
    if (success) navigate("/");
  }

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <ConfirmDialog
        open={confirmCloseOpen}
        title="Cerrar partida"
        message="¿Estás seguro de que querés cerrar la partida? Esto termina la partida para todos los jugadores."
        confirmLabel="Cerrar partida"
        onConfirm={confirmCloseSession}
        onCancel={() => setConfirmCloseOpen(false)}
      />
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-start justify-between gap-6 border-b border-border pb-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Panel de anfitrión
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {sessionByCode.session.name}{" "}
              <span className="text-primary">({code})</span>
            </h1>

            <div className="mt-4">
              {isClosed ? (
                <p className="text-sm text-muted-foreground">Esta partida está cerrada.</p>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={closing}
                  onClick={() => setConfirmCloseOpen(true)}
                >
                  {closing ? "Cerrando..." : "Cerrar partida"}
                </Button>
              )}
              {closeError && <p className="mt-2 text-sm text-destructive">{closeError}</p>}
            </div>

            {!isClosed && userId && myParticipant?.status === "accepted" && (
              <div className="mt-4">
                <Button variant="outline" nativeButton={false} render={<Link to={`/session/${code}/play`} />}>
                  Ver mapa como jugador
                </Button>
              </div>
            )}

            {!isClosed && userId && myParticipant?.status !== "accepted" && (
              <div className="mt-4">
                <HostJoinForm
                  sessionId={currentSessionId}
                  teams={teams}
                  userId={userId}
                  defaultDisplayName={
                    session.status === "ready"
                      ? ((session.user.user_metadata?.full_name as string | undefined) ??
                          (session.user.user_metadata?.name as string | undefined) ??
                          null)
                      : null
                  }
                  onJoined={() => navigate(`/session/${code}/play`)}
                />
              </div>
            )}
          </div>

          {!isClosed && code && (
            <div className="shrink-0">
              <SessionCodeQr code={code} size={120} />
            </div>
          )}
        </header>

        <div className="space-y-6">
          {!isClosed && (
            <TacticalPanel title="Mapa">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMap((prev) => !prev)}
              >
                {showMap ? "Ocultar mapa" : "Ver todos los equipos"}
              </Button>
              {showMap && (
                <div className="mt-4">
                  <MapView
                    positions={positionsWithTeam}
                    restriction={restriction}
                    teamColors={teamColors}
                  />
                </div>
              )}
            </TacticalPanel>
          )}

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
