import { Link, useParams } from "react-router";
import { Button } from "../components/ui/button";
import MapView from "../components/MapView";
import TacticalPanel from "../components/TacticalPanel";
import TeamRoster from "../components/TeamRoster";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useReplayData } from "../hooks/useReplayData";
import { useSessionRoster } from "../hooks/useSessionRoster";
import { getPositionsAtTime } from "../lib/replayEngine";

function ReplayPage() {
  const { code } = useParams<{ code: string }>();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId = sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const replayData = useReplayData(sessionId);
  const rosterState = useSessionRoster(sessionId);

  if (session.status !== "ready") return null;

  if (session.isAnonymous) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Iniciá sesión con Google desde la pantalla principal para ver el replay.
        </p>
        <Link
          to="/"
          className="text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          Volver al inicio
        </Link>
      </main>
    );
  }

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

  const positions =
    replayData.status === "ready" ? getPositionsAtTime(replayData.tracks, replayData.tracks.endTime) : [];

  return (
    <main className="min-h-svh bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <h1 className="truncate text-sm font-bold tracking-wide">
          {sessionByCode.session.name} <span className="text-muted-foreground">({code})</span>
        </h1>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/account" />}>
          Volver a mis partidas
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
        <div className="min-w-0 flex-1">
          {replayData.status === "loading" && (
            <p className="text-sm text-muted-foreground">Cargando recorrido...</p>
          )}
          {replayData.status === "error" && (
            <p className="text-sm text-destructive">{replayData.message}</p>
          )}
          {replayData.status !== "loading" && replayData.status !== "error" && (
            <MapView positions={positions} restriction={restriction} />
          )}
        </div>
        <div className="w-full sm:w-64">
          <TacticalPanel title="Equipos">
            {rosterState.status === "loading" && (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            )}
            {rosterState.status === "error" && (
              <p className="text-sm text-destructive">{rosterState.message}</p>
            )}
            {rosterState.status === "ready" && <TeamRoster roster={rosterState.roster} />}
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default ReplayPage;
