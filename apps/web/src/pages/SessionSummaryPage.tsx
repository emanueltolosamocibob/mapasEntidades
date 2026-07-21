import type { ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router";
import TacticalPanel from "../components/TacticalPanel";
import { Button } from "../components/ui/button";
import { useSession } from "../contexts/SessionContext";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useReplayData } from "../hooks/useReplayData";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { computeMatchStats } from "../lib/replayEngine";

type PersonalSummary = { durationMs: number; distanceM: number };

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="border border-border p-3">
      <p className="text-2xl font-bold text-primary tabular-nums">
        {value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 text-xs tracking-[0.15em] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function formatHours(ms: number) {
  return (ms / 3_600_000).toFixed(1);
}

function formatKm(m: number) {
  return (m / 1000).toFixed(1);
}

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("es-AR");
}

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      {children}
    </main>
  );
}

function HomeLink() {
  return (
    <Link
      to="/"
      className="text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
    >
      Volver al inicio
    </Link>
  );
}

function SessionSummaryPage() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const session = useSession();
  const sessionByCode = useSessionByCode(code);
  const sessionId = sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const userId = session.status === "ready" ? session.user.id : undefined;
  const myParticipant = useMyParticipant(sessionId, userId);

  const isHost =
    sessionByCode.status === "found" && userId === sessionByCode.session.host_id;

  const personalSummary = (location.state as { personalSummary?: PersonalSummary } | null)
    ?.personalSummary;

  // El host siempre auto-fetchea (conserva acceso para siempre vía
  // host_id). Un jugador con el resumen ya calculado (vino de "Salir",
  // ver PlayPage.tsx) no necesita pedir nada de nuevo — y si lo hiciera,
  // export_session_positions ya lo rechazaría porque leave_session lo
  // marca 'kicked' (ver nota en el plan de MAP-42).
  const shouldFetch = isHost || !personalSummary;
  const replayData = useReplayData(shouldFetch ? sessionId : undefined);
  const matchStats = replayData.status === "ready" ? computeMatchStats(replayData.tracks) : null;

  if (session.status !== "ready" || sessionByCode.status === "loading") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm tracking-[0.2em] text-muted-foreground uppercase">
        Cargando...
      </main>
    );
  }

  if (sessionByCode.status === "not-found") {
    return (
      <CenteredMessage>
        <p className="text-sm text-muted-foreground">Partida no encontrada.</p>
        <HomeLink />
      </CenteredMessage>
    );
  }

  if (sessionByCode.status === "error") {
    return (
      <CenteredMessage>
        <p className="text-sm text-destructive">{sessionByCode.message}</p>
        <HomeLink />
      </CenteredMessage>
    );
  }

  const myStats: PersonalSummary | undefined =
    personalSummary ??
    (myParticipant?.entity_id ? matchStats?.get(myParticipant.entity_id) : undefined);

  if (!isHost && shouldFetch && replayData.status === "error") {
    return (
      <CenteredMessage>
        <p className="text-sm text-muted-foreground">
          Ya no tenés acceso a los datos de esta partida.
        </p>
        <HomeLink />
      </CenteredMessage>
    );
  }

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 border-b border-border pb-6">
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Resumen de partida
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {sessionByCode.session.name} <span className="text-primary">({code})</span>
          </h1>
        </header>

        {isHost && (
          <>
            {replayData.status === "loading" && (
              <p className="mb-6 text-sm text-muted-foreground">Cargando...</p>
            )}
            {replayData.status === "ready" && matchStats && (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <StatTile
                    label="Duración"
                    value={formatHours(replayData.tracks.endTime - replayData.tracks.startTime)}
                    unit="h"
                  />
                  <StatTile label="Jugadores" value={String(matchStats.size)} unit="" />
                </div>
                <p className="mb-6 text-xs text-muted-foreground">
                  Inicio: {formatDateTime(replayData.tracks.startTime)} — Fin:{" "}
                  {formatDateTime(replayData.tracks.endTime)}
                </p>
                <TacticalPanel title="Por jugador" className="mb-6">
                  <div className="space-y-2">
                    {[...matchStats.entries()]
                      .sort(([, a], [, b]) => b.distanceM - a.distanceM)
                      .map(([entityId, entry]) => (
                      <div
                        key={entityId}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="truncate">
                          {entry.nickname}{" "}
                          <span
                            className="text-xs text-muted-foreground"
                            style={{ color: entry.teamColor ?? undefined }}
                          >
                            {entry.teamName}
                          </span>
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {formatHours(entry.durationMs)}h · {formatKm(entry.distanceM)}km
                        </span>
                      </div>
                    ))}
                  </div>
                </TacticalPanel>
              </>
            )}
          </>
        )}

        {!isHost && myStats && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <StatTile label="Tiempo jugado" value={formatHours(myStats.durationMs)} unit="h" />
            <StatTile label="Distancia caminada" value={formatKm(myStats.distanceM)} unit="km" />
          </div>
        )}

        <Button nativeButton={false} render={<Link to="/" />}>
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}

export default SessionSummaryPage;
