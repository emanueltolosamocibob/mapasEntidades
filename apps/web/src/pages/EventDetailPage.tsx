import { Link, useParams } from "react-router";
import TacticalPanel from "../components/TacticalPanel";

// Stub de MAP-64 -- el detalle real (consumiendo get_session_listing())
// se arma en MAP-65. Existe como ruta ya para que las cards del listado
// lleven a algo real en vez de un link roto.
function EventDetailPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-border pb-6">
          <Link
            to="/eventos"
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-primary"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Evento <span className="text-primary">{code}</span>
          </h1>
        </header>

        <TacticalPanel title="Próximamente">
          <p className="text-sm text-muted-foreground">
            El detalle de este evento todavía no está armado.
          </p>
        </TacticalPanel>
      </div>
    </main>
  );
}

export default EventDetailPage;
