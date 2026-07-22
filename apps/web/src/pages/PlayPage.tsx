import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { TriangleAlert, X } from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { usePositions } from "../hooks/usePositions";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useSendPosition } from "../hooks/useSendPosition";
import { useWakeLock } from "../hooks/useWakeLock";
import { useLeaveSession } from "../hooks/useLeaveSession";
import { useTeamRoster } from "../hooks/useTeamRoster";
import { useAirsoftTeams } from "../hooks/useAirsoftTeams";
import { isSessionClosed } from "../lib/sessionStatus";
import { supabase } from "../lib/supabaseClient";
import { buildReplayTracks, computeMatchStats, type PositionHistoryRow } from "../lib/replayEngine";
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
  useWakeLock(!isClosed && myParticipant?.status === "accepted");
  const [showLockWarning, setShowLockWarning] = useState(true);

  const { leaveSession } = useLeaveSession();
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);

  async function confirmExit() {
    setConfirmExitOpen(false);
    setExitError(null);

    if (myParticipant?.status === "accepted") {
      // Calculamos el resumen ANTES de salir: leaveSession marca la fila
      // como 'kicked', y export_session_positions ya no autoriza a un
      // participante no-aceptado (ver MAP-42) — si lo pidiéramos después
      // de salir, esto fallaría.
      let personalSummary: { durationMs: number; distanceM: number } | null = null;
      if (sessionId && myParticipant.entity_id) {
        const { data } = await supabase.rpc("export_session_positions", {
          p_session_id: sessionId,
        });
        const tracks = buildReplayTracks((data ?? []) as PositionHistoryRow[]);
        const stats = computeMatchStats(tracks).get(myParticipant.entity_id);
        if (stats) {
          personalSummary = { durationMs: stats.durationMs, distanceM: stats.distanceM };
        }
      }

      const left = await leaveSession(myParticipant.id);
      if (!left) {
        // No navegamos como si hubiera salido bien -- si esto fallara en
        // silencio (MAP-52), la fila queda 'accepted' y bloquea para
        // siempre un reingreso.
        setExitError("No se pudo salir de la partida. Probá de nuevo.");
        return;
      }
      navigate(`/session/${code}/summary`, { state: { personalSummary } });
      return;
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
          <span className="hidden shrink-0 text-muted-foreground sm:inline">({code})</span>
          {sendError && (
            <span className="hidden shrink-0 items-center gap-1.5 text-xs font-normal tracking-[0.2em] text-destructive sm:flex">
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
      {exitError && (
        <p className="border-b border-border bg-destructive/10 px-4 py-2 text-xs text-destructive sm:px-6">
          {exitError}
        </p>
      )}
      {showLockWarning && (
        <div className="mx-4 mt-4 flex items-center gap-2 border border-destructive bg-destructive/10 px-3 py-2 text-xs font-bold tracking-[0.1em] text-destructive uppercase sm:mx-6 sm:mt-6">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            NO BLOQUEES la pantalla del celular — si lo hacés, tu equipo deja de verte en el mapa.
          </span>
          <button
            type="button"
            onClick={() => setShowLockWarning(false)}
            aria-label="Cerrar aviso"
            className="shrink-0 text-destructive hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-6">
        <div className="relative min-w-0 flex-1">
          <MapView
            positions={positions}
            restriction={restriction}
            myTeamId={myParticipant?.status === "accepted" ? myParticipant.team_id : undefined}
            sessionId={sessionId}
            userId={userId}
          />
          <div className="absolute top-16 left-3 z-[1000] flex flex-col items-start gap-1 sm:hidden">
            <span className="border border-primary bg-background/90 px-2 py-1 text-xs tracking-[0.15em] text-primary">
              {code}
            </span>
            {sendError && (
              <span className="flex items-center gap-1.5 border border-destructive bg-background/90 px-2 py-1 text-xs tracking-[0.15em] text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Sin señal
              </span>
            )}
          </div>
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
