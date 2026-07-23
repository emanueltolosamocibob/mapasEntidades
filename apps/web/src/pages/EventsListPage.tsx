import { Link } from "react-router";
import TacticalPanel from "../components/TacticalPanel";
import EventStatusTag from "../components/EventStatusTag";
import EventCapacityTag from "../components/EventCapacityTag";
import { Button } from "../components/ui/button";
import { usePublicEvents, type PublicEvent } from "../hooks/usePublicEvents";
import { getEventStatus } from "../lib/eventStatus";

function EventCard({ event }: { event: PublicEvent }) {
  const status = getEventStatus(event);

  return (
    <Link
      to={`/eventos/${event.code}`}
      className="group relative block border border-border bg-card/60 transition-colors hover:border-primary"
    >
      <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-border group-hover:border-primary" />
      <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-border group-hover:border-primary" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-border group-hover:border-primary" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-border group-hover:border-primary" />

      <div className="relative">
        {event.coverPhotoUrl ? (
          <img
            src={event.coverPhotoUrl}
            alt=""
            className="h-36 w-full border-b border-border object-cover"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center border-b border-border text-xs tracking-[0.15em] text-muted-foreground uppercase">
            Sin portada
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <EventStatusTag status={status} />
          <EventCapacityTag
            acceptedCount={event.acceptedCount}
            totalCapacity={event.totalCapacity}
          />
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-foreground uppercase">{event.name}</p>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
        )}
      </div>
    </Link>
  );
}

function EventsListPage() {
  const { state } = usePublicEvents();

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link
              to="/"
              className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-primary"
            >
              ← Volver
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-primary">Eventos</span>
            </h1>
          </div>
          <Button nativeButton={false} render={<Link to="/eventos/publicar" />}>
            + Publicar evento
          </Button>
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
                Todavía no hay eventos publicados para mostrar acá.
              </p>
            </TacticalPanel>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {state.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ))}
      </div>
    </main>
  );
}

export default EventsListPage;
