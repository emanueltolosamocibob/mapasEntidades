import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { useParticipants } from "../hooks/useParticipants";
import { useCloseSession } from "../hooks/useCloseSession";
import { useStartSession } from "../hooks/useStartSession";
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
import SessionPhotosPanel from "../components/SessionPhotosPanel";

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
  const { startSession, loading: starting, error: startError } = useStartSession();
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
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
  // Evento publicado, todavía sin arrancar (Fase 7) -- partida rápida
  // siempre tiene started_at seteado desde que se crea, así que este panel
  // nunca aparece ahí.
  const isUnstartedEvent = sessionByCode.session.started_at === null;

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
    if (success) navigate(`/session/${code}/summary`);
  }

  // Sin navegación explícita: useSessionByCode ya está suscripto a UPDATE
  // en sessions (filtrado por code), así que started_at llega solo y la
  // página se re-renderiza sola (el panel de Fotos desaparece, etc.).
  async function confirmStartSession() {
    setConfirmStartOpen(false);
    await startSession(currentSessionId);
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
      <ConfirmDialog
        open={confirmStartOpen}
        title="Iniciar partida"
        message="¿Iniciar la partida ahora? A partir de este momento arranca el tracking en vivo y el evento deja de listarse públicamente para nuevas inscripciones."
        confirmLabel="Iniciar partida"
        onConfirm={confirmStartSession}
        onCancel={() => setConfirmStartOpen(false)}
      />
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-start justify-between gap-6 border-b border-border pb-6">
          <div className="min-w-0 flex-1">
            {isUnstartedEvent && (
              <Link
                to="/eventos"
                className="mb-3 inline-block text-sm tracking-[0.2em] text-white uppercase hover:text-primary"
              >
                ← Volver
              </Link>
            )}
            <p className="mt-1 text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Panel de anfitrión
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {sessionByCode.session.name}{" "}
              <span className="text-primary">({code})</span>
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isClosed ? (
                <p className="text-sm text-muted-foreground">Esta partida está cerrada.</p>
              ) : (
                <>
                  {isUnstartedEvent && (
                    <Button
                      type="button"
                      disabled={starting}
                      onClick={() => setConfirmStartOpen(true)}
                    >
                      {starting ? "Iniciando..." : "Iniciar partida"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={closing}
                    onClick={() => setConfirmCloseOpen(true)}
                  >
                    {closing ? "Cerrando..." : "Cerrar partida"}
                  </Button>
                </>
              )}
            </div>
            {startError && <p className="mt-2 text-sm text-destructive">{startError}</p>}
            {closeError && <p className="mt-2 text-sm text-destructive">{closeError}</p>}

            {!isClosed && userId && myParticipant?.status === "accepted" && (
              <div className="mt-4">
                <Button variant="outline" nativeButton={false} render={<Link to={`/session/${code}/play`} />}>
                  Ver mapa como jugador
                </Button>
              </div>
            )}

            {!isClosed && !isUnstartedEvent && userId && myParticipant?.status !== "accepted" && (
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
              <SessionCodeQr
                code={code}
                size={120}
                path={sessionByCode.session.kind === "event" ? `/eventos/${code}` : undefined}
              />
            </div>
          )}
        </header>

        <div className="space-y-6">
          {isUnstartedEvent && (
            <TacticalPanel title="Fotos">
              <SessionPhotosPanel sessionId={currentSessionId} />
            </TacticalPanel>
          )}

          {!isClosed && (
            <TacticalPanel title="Mapa">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMap((prev) => !prev)}
              >
                {showMap ? "Ocultar mapa" : "Ver mapa de juego"}
              </Button>
              {showMap && (
                <div className="mt-4">
                  <MapView
                    positions={positionsWithTeam}
                    restriction={restriction}
                    teamColors={teamColors}
                    sessionId={sessionId}
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
