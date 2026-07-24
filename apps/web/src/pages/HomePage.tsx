import { Link } from "react-router";
import GoogleAccountPanel from "../components/GoogleAccountPanel";
import TacticalPanel from "../components/TacticalPanel";
import { Button } from "../components/ui/button";

// Íconos custom rellenos, bordes rectos -- mismo criterio "estilo stencil
// táctico" que MAP_MARKER_SHAPE_SVG en tacticalIcon.ts, en vez de los
// íconos redondeados/genéricos de lucide-react.
function FastForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mb-3 h-6 w-6 text-primary" fill="currentColor">
      <polygon points="2,4 12,12 2,20" />
      <polygon points="12,4 22,12 12,20" />
    </svg>
  );
}

function WaypointIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mb-3 h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HomePage() {
  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-border pb-6">
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Sistema de tracking en tiempo real
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Airsoft<span className="text-primary">Maps</span>
          </h1>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <TacticalPanel title="Partida privada">
            <FastForwardIcon />
            <p className="mb-4 text-sm text-muted-foreground">Creá o unite a una partida privada.</p>
            <Button nativeButton={false} render={<Link to="/partida-rapida" />}>
              Entrar
            </Button>
          </TacticalPanel>

          <TacticalPanel title="Eventos">
            <WaypointIcon />
            <p className="mb-4 text-sm text-muted-foreground">
              Eventos públicos - anotate a un equipo ya.
            </p>
            <Button nativeButton={false} render={<Link to="/eventos" />}>
              Ver eventos
            </Button>
          </TacticalPanel>
        </div>

        <div className="mt-6">
          <TacticalPanel title="Cuenta de Google">
            <GoogleAccountPanel />
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
