import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../components/ui/button";
import MapView from "../components/MapView";
import ReplayControls, { type VisibilityMode } from "../components/ReplayControls";
import TacticalPanel from "../components/TacticalPanel";
import TeamRoster from "../components/TeamRoster";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useReplayClock } from "../hooks/useReplayClock";
import { useReplayData } from "../hooks/useReplayData";
import { useSessionExportKml } from "../hooks/useSessionExportKml";
import { useSessionRoster } from "../hooks/useSessionRoster";
import { downloadTextFile } from "../lib/downloadFile";
import { getPositionsAtTime } from "../lib/replayEngine";

function ReplayPage() {
  const { code } = useParams<{ code: string }>();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId = sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const userId = session.status === "ready" ? session.user.id : undefined;
  const replayData = useReplayData(sessionId);
  const rosterState = useSessionRoster(sessionId);
  const myParticipant = useMyParticipant(sessionId, userId);
  const { state: exportState, exportSession } = useSessionExportKml();
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("all");

  const startTime = replayData.status === "ready" ? replayData.tracks.startTime : 0;
  const endTime = replayData.status === "ready" ? replayData.tracks.endTime : 0;
  const clock = useReplayClock(startTime, endTime);

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

  const currentSession = sessionByCode.session;

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

  const allPositions =
    replayData.status === "ready" ? getPositionsAtTime(replayData.tracks, clock.currentTime) : [];

  const positions = allPositions.filter((position) => {
    if (visibilityMode === "team") return position.teamId === myParticipant?.team_id;
    if (visibilityMode === "me") return position.entityId === myParticipant?.entity_id;
    return true;
  });

  async function handleExport() {
    try {
      const kml = await exportSession(currentSession.id, currentSession.name);
      if (kml) {
        downloadTextFile(
          `${currentSession.code}.kml`,
          kml,
          "application/vnd.google-earth.kml+xml"
        );
      }
    } catch {
      // el error ya queda reflejado en exportState.message
    }
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <h1 className="truncate text-sm font-bold tracking-wide">
          {sessionByCode.session.name} <span className="text-muted-foreground">({code})</span>
        </h1>
        <div className="flex items-center gap-2">
          {exportState.status === "error" && (
            <p className="text-xs text-destructive">{exportState.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exportState.status === "loading"}
            onClick={handleExport}
          >
            {exportState.status === "loading" ? "Generando..." : "Exportar a Google Earth"}
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/account" />}>
            Volver a mis partidas
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
        <div className="min-w-0 flex-1 space-y-4">
          {replayData.status === "loading" && (
            <p className="text-sm text-muted-foreground">Cargando recorrido...</p>
          )}
          {replayData.status === "error" && (
            <p className="text-sm text-destructive">{replayData.message}</p>
          )}
          {replayData.status !== "loading" && replayData.status !== "error" && (
            <>
              <MapView
                positions={positions}
                restriction={restriction}
                myTeamId={myParticipant?.team_id}
              />
              <TacticalPanel title="Reproductor">
                <ReplayControls
                  startTime={startTime}
                  endTime={endTime}
                  currentTime={clock.currentTime}
                  isPlaying={clock.isPlaying}
                  onToggle={clock.toggle}
                  onSeek={clock.seek}
                  onSpeedChange={clock.setSpeed}
                  visibilityMode={visibilityMode}
                  onVisibilityModeChange={setVisibilityMode}
                  hasTeam={!!myParticipant?.team_id}
                  hasSelf={!!myParticipant?.entity_id}
                />
              </TacticalPanel>
            </>
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
