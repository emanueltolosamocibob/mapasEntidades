import { Link } from "react-router";
import { CalendarDays, Zap } from "lucide-react";
import TacticalPanel from "../components/TacticalPanel";
import { Button } from "../components/ui/button";

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
          <TacticalPanel title="Partida rápida">
            <Zap className="mb-3 h-6 w-6 text-primary" />
            <p className="mb-4 text-sm text-muted-foreground">
              Creá o unite a una partida al toque, como hasta ahora.
            </p>
            <Button nativeButton={false} render={<Link to="/partida-rapida" />}>
              Entrar
            </Button>
          </TacticalPanel>

          <TacticalPanel title="Eventos">
            <CalendarDays className="mb-3 h-6 w-6 text-primary" />
            <p className="mb-4 text-sm text-muted-foreground">
              Convocatorias publicadas con anticipación — anotate a un equipo antes del día del
              partido.
            </p>
            <Button nativeButton={false} render={<Link to="/eventos" />}>
              Ver eventos
            </Button>
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
