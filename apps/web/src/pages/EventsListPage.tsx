import { Link } from "react-router";
import TacticalPanel from "../components/TacticalPanel";
import { Button } from "../components/ui/button";

// El listado real (consumiendo list_public_events()) se arma en MAP-64 --
// esto ya deja el botón de publicar (MAP-60) funcionando.
function EventsListPage() {
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

        <TacticalPanel title="Próximamente">
          <p className="text-sm text-muted-foreground">
            Todavía no hay eventos publicados para mostrar acá.
          </p>
        </TacticalPanel>
      </div>
    </main>
  );
}

export default EventsListPage;
