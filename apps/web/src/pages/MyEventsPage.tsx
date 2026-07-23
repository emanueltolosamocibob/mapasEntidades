import { Link } from "react-router";
import TacticalPanel from "../components/TacticalPanel";
import { useSession } from "../contexts/SessionContext";
import { useMyEvents } from "../hooks/useMyEvents";

function statusLabel(event: { status: string; started_at: string | null }) {
  if (event.status === "closed") return "Finalizado";
  if (event.started_at !== null) return "En curso";
  return "Sin arrancar";
}

function MyEventsPage() {
  const session = useSession();
  const userId = session.status === "ready" ? session.user.id : undefined;
  const { state } = useMyEvents(userId);

  if (session.status !== "ready") return null;

  if (session.isAnonymous) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Iniciá sesión con Google desde la pantalla principal para ver tus eventos.
        </p>
        <Link
          to="/eventos"
          className="text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          Volver a eventos
        </Link>
      </main>
    );
  }

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-border pb-6">
          <Link
            to="/eventos"
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-primary"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Mis <span className="text-primary">eventos</span>
          </h1>
        </header>

        {state.status === "loading" && (
          <p className="text-sm text-muted-foreground">Cargando eventos...</p>
        )}

        {state.status === "error" && (
          <TacticalPanel title="Error" accent="destructive">
            <p className="text-sm text-destructive/90">{state.message}</p>
          </TacticalPanel>
        )}

        {state.status === "ready" &&
          (state.events.length === 0 ? (
            <TacticalPanel title="Sin eventos">
              <p className="text-sm text-muted-foreground">
                Todavía no publicaste ningún evento.
              </p>
            </TacticalPanel>
          ) : (
            <div className="space-y-3">
              {state.events.map((event) => (
                <Link
                  key={event.id}
                  to={`/session/${event.code}/host`}
                  className="group flex items-center justify-between gap-4 border border-border bg-card/60 p-4 transition-colors hover:border-primary"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground uppercase">
                      {event.name} <span className="text-primary">({event.code})</span>
                    </p>
                    <p className="mt-1 text-xs tracking-[0.15em] text-muted-foreground uppercase">
                      {statusLabel(event)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tracking-[0.2em] text-muted-foreground uppercase group-hover:text-primary">
                    Configurar →
                  </span>
                </Link>
              ))}
            </div>
          ))}
      </div>
    </main>
  );
}

export default MyEventsPage;
