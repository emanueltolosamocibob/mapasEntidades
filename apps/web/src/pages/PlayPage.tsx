import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { usePositions } from "../hooks/usePositions";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useSendPosition } from "../hooks/useSendPosition";
import { useLeaveSession } from "../hooks/useLeaveSession";
import { useTeamRoster } from "../hooks/useTeamRoster";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { isSessionClosed } from "../lib/sessionStatus";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import MapView from "../components/MapView";
import TacticalPanel from "../components/TacticalPanel";
import ConfirmDialog from "../components/ConfirmDialog";

const SEND_INTERVAL_OPTIONS = [3000, 5000, 10000, 30000];

function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId =
    sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const userId = session.status === "ready" ? session.user.id : undefined;
  const { positions } = usePositions(sessionId);
  const roster = useTeamRoster(sessionId);
  const teams = useAirsoftTeams(sessionId);

  const isClosed =
    sessionByCode.status === "found" && isSessionClosed(sessionByCode.session);

  const myParticipant = useMyParticipant(sessionId, userId);
  const isKicked = myParticipant?.status === "kicked";
  const isHost =
    sessionByCode.status === "found" && userId === sessionByCode.session.host_id;
  const myTeam = teams.find((team) => team.id === myParticipant?.team_id);
  const [sendIntervalMs, setSendIntervalMs] = useState(5000);
  const { hasError: sendError } = useSendPosition(
    !isClosed && myParticipant?.status === "accepted" ? myParticipant.entity_id : null,
    sendIntervalMs
  );

  const { leaveSession } = useLeaveSession();
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  async function confirmExit() {
    setConfirmExitOpen(false);
    if (myParticipant?.status === "accepted") {
      await leaveSession(myParticipant.id);
    }
    navigate("/");
  }

  const restriction =
    sessionByCode.status === "found" &&
    sessionByCode.session.origin_lat !== null &&
    sessionByCode.session.origin_lng !== null &&
    sessionByCode.session.movement_radius_m !== null
      ? {
          lat: sessionByCode.session.origin_lat,
          lng: sessionByCode.session.origin_lng,
          radiusM: sessionByCode.session.movement_radius_m,
        }
      : null;

  if (sessionByCode.status === "loading") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm tracking-[0.2em] text-muted-foreground uppercase">
        Cargando partida...
      </main>
    );
  }

  if (sessionByCode.status === "not-found") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm text-muted-foreground">
        Partida no encontrada (o no tenés permiso para verla).
      </main>
    );
  }

  if (sessionByCode.status === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm text-destructive">
        {sessionByCode.message}
      </main>
    );
  }

  if (isKicked) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-sm text-destructive">
          Fuiste expulsado de esta partida por el anfitrión.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </main>
    );
  }

  if (isClosed) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <h1 className="text-lg font-bold">
          {sessionByCode.session.name} ({code})
        </h1>
        <p className="text-sm text-muted-foreground">Esta partida está cerrada.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </main>
    );
  }

  return (
    <main className="tactical-grid min-h-svh bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <h1 className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-wide">
          <span className="min-w-0 truncate">{sessionByCode.session.name}</span>
          <span className="shrink-0 text-muted-foreground">({code})</span>
          {sendError && (
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-normal tracking-[0.2em] text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              Sin señal
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          {isHost ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link to={`/session/${code}/host`} />}
            >
              Volver al panel de anfitrión
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmExitOpen(true)}>
              Salir
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmExitOpen}
        title="Salir de la partida"
        message="¿Estás seguro de que querés salir de la partida?"
        confirmLabel="Salir"
        onConfirm={confirmExit}
        onCancel={() => setConfirmExitOpen(false)}
      />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
        <div className="min-w-0 flex-1">
          <MapView positions={positions} restriction={restriction} />
        </div>
        <div className="flex w-full flex-col gap-4 sm:w-64">
          <TacticalPanel title="Envío de posición">
            <div className="flex gap-1.5">
              {SEND_INTERVAL_OPTIONS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={sendIntervalMs === option ? "default" : "outline"}
                  onClick={() => setSendIntervalMs(option)}
                >
                  {option / 1000}s
                </Button>
              ))}
            </div>
          </TacticalPanel>
          <TacticalPanel title={myTeam?.name ?? "Mi equipo"}>
            <ul className="space-y-2 text-sm">
              {roster.map((member) => {
                const hasPosition = positions.some((p) => p.entityId === member.entityId);
                return (
                  <li key={member.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        hasPosition ? "bg-primary" : "bg-muted-foreground/40"
                      )}
                    />
                    {member.nickname}
                  </li>
                );
              })}
            </ul>
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default PlayPage;
