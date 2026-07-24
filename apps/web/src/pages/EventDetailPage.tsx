import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import MapView from "../components/MapView";
import TacticalPanel from "../components/TacticalPanel";
import EventStatusTag from "../components/EventStatusTag";
import { Button } from "../components/ui/button";
import { useEventListing, type EventListingTeam } from "../hooks/useEventListing";
import { getEventStatus } from "../lib/eventStatus";
import EventJoinForm from "../components/EventJoinForm";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-8 text-center text-sm text-muted-foreground">
      {children}
    </main>
  );
}

function TeamRoster({ team }: { team: EventListingTeam }) {
  const capacityLabel =
    team.maxPlayers !== null ? `${team.acceptedCount}/${team.maxPlayers}` : `${team.acceptedCount} inscriptos`;

  return (
    <div className="border border-border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0"
            style={{ backgroundColor: team.color ?? "var(--primary)" }}
          />
          <p className="min-w-0 truncate text-sm font-bold text-foreground uppercase">
            {team.name}
          </p>
        </div>
        <span className="shrink-0 text-xs tracking-[0.1em] text-muted-foreground">
          {capacityLabel}
        </span>
      </div>
      {team.players.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {team.players.map((nickname) => (
            <li key={nickname}>{nickname}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Todavía nadie se anotó.</p>
      )}
    </div>
  );
}

function EventDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { state, refresh } = useEventListing(code);
  const [showMap, setShowMap] = useState(false);

  if (state.status === "loading") {
    return <CenteredMessage>Cargando evento...</CenteredMessage>;
  }

  if (state.status === "not-found") {
    return <CenteredMessage>Evento no encontrado (o ya no está disponible).</CenteredMessage>;
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm text-destructive">
        {state.message}
      </main>
    );
  }

  const { event } = state;
  const status = getEventStatus({
    status: event.status,
    startedAt: event.startedAt,
    // El listado ya calcula esto server-side (has_open_slots) -- acá alcanza
    // con si algún equipo tiene lugar, que ya tenemos con teams/acceptedCount.
    hasOpenSlots: event.teams.some(
      (team) => team.maxPlayers === null || team.acceptedCount < team.maxPlayers
    ),
  });

  const cover = event.photos.find((photo) => photo.kind === "cover") ?? null;
  const documents = event.photos.filter((photo) => photo.kind === "document");

  const restriction =
    event.originLat !== null && event.originLng !== null && event.movementRadiusM !== null
      ? { lat: event.originLat, lng: event.originLng, radiusM: event.movementRadiusM }
      : null;

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-border pb-6">
          <Link
            to="/eventos"
            className="text-sm tracking-[0.2em] text-white uppercase hover:text-primary"
          >
            ← Volver
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-primary">{event.name}</span>
            </h1>
            <EventStatusTag status={status} />
          </div>
        </header>

        <div className="space-y-6">
          {cover && (
            <img
              src={cover.url}
              alt=""
              className="h-56 w-full border border-border object-cover sm:h-72"
            />
          )}

          <TacticalPanel title="Detalles">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                  Fecha y hora
                </dt>
                <dd className="text-foreground">
                  {event.scheduledAt
                    ? new Date(event.scheduledAt).toLocaleString("es-AR", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })
                    : "A confirmar"}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                  Organizador
                </dt>
                <dd className="text-foreground">{event.organizerName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                  Contacto
                </dt>
                <dd>
                  {event.contactPhone ? (
                    <a
                      href={`https://wa.me/${event.contactPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                    >
                      {event.contactPhone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                  Dirección
                </dt>
                <dd>
                  {event.address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                    >
                      {event.address}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {(event.byopCost !== null || event.byopDeposit !== null) && (
                <div>
                  <dt className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                    Costo BYOP
                  </dt>
                  <dd className="text-foreground">
                    {event.byopCost !== null ? `$${event.byopCost}` : "—"}
                    {event.byopDeposit !== null && ` (seña $${event.byopDeposit})`}
                  </dd>
                </div>
              )}
              {(event.rentalCost !== null || event.rentalDeposit !== null) && (
                <div>
                  <dt className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                    Costo alquiler de equipo
                  </dt>
                  <dd className="text-foreground">
                    {event.rentalCost !== null ? `$${event.rentalCost}` : "—"}
                    {event.rentalDeposit !== null && ` (seña $${event.rentalDeposit})`}
                  </dd>
                </div>
              )}
            </dl>
          </TacticalPanel>

          <TacticalPanel title="Descripción">
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {event.description || "El anfitrión todavía no cargó una descripción."}
            </p>
          </TacticalPanel>

          {documents.length > 0 && (
            <TacticalPanel title="Documentos">
              <div className="grid grid-cols-3 gap-2">
                {documents.map((doc) => (
                  <img
                    key={doc.storagePath}
                    src={doc.url}
                    alt=""
                    className="h-24 w-full border border-border object-cover"
                  />
                ))}
              </div>
            </TacticalPanel>
          )}

          <TacticalPanel title="Equipos">
            {event.teams.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {event.teams.map((team) => (
                  <TeamRoster key={team.id} team={team} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Este evento todavía no tiene equipos.</p>
            )}
          </TacticalPanel>

          <TacticalPanel title="Mapa">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMap((current) => !current)}
              className={showMap ? "mb-4" : ""}
            >
              {showMap ? "Ocultar mapa" : "Mostrar mapa"}
            </Button>
            {showMap && <MapView positions={[]} restriction={restriction} />}
          </TacticalPanel>

          {event.startedAt === null && event.teams.length > 0 && (
            <TacticalPanel title="Inscribirme">
              <EventJoinForm code={event.code} teams={event.teams} onJoined={refresh} />
            </TacticalPanel>
          )}
        </div>
      </div>
    </main>
  );
}

export default EventDetailPage;
