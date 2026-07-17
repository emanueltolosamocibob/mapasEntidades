import { useNavigate, useParams } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { usePositions } from "../hooks/usePositions";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useSendPosition } from "../hooks/useSendPosition";
import { useLeaveSession } from "../hooks/useLeaveSession";
import { useTeamRoster } from "../hooks/useTeamRoster";
import { isSessionClosed } from "../lib/sessionStatus";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import MapView from "../components/MapView";
import TacticalPanel from "../components/TacticalPanel";

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

  const isClosed =
    sessionByCode.status === "found" && isSessionClosed(sessionByCode.session);

  const myParticipant = useMyParticipant(sessionId, userId);
  const isKicked = myParticipant?.status === "kicked";
  useSendPosition(
    !isClosed && myParticipant?.status === "accepted" ? myParticipant.entity_id : null
  );

  const { leaveSession } = useLeaveSession();

  async function handleExit() {
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
        Cargando sesión...
      </main>
    );
  }

  if (sessionByCode.status === "not-found") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm text-muted-foreground">
        Sesión no encontrada (o no tenés permiso para verla).
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
          Fuiste expulsado de esta sesión por el anfitrión.
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
        <p className="text-sm text-muted-foreground">Esta sesión está cerrada.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <h1 className="truncate text-sm font-bold tracking-wide">
          {sessionByCode.session.name} <span className="text-muted-foreground">({code})</span>
        </h1>
        <Button variant="outline" size="sm" onClick={handleExit}>
          Salir
        </Button>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
        <div className="min-w-0 flex-1">
          <MapView positions={positions} restriction={restriction} />
        </div>
        <div className="w-full sm:w-64">
          <TacticalPanel title="Mi equipo">
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
