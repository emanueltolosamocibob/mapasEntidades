import { Link } from "react-router";
import PublishEventForm from "../components/PublishEventForm";
import TacticalPanel from "../components/TacticalPanel";

function PublishEventPage() {
  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-xl">
        <header className="mb-10 border-b border-border pb-6">
          <Link
            to="/eventos"
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-primary"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Publicar <span className="text-primary">evento</span>
          </h1>
        </header>

        <TacticalPanel title="Convocatoria">
          <PublishEventForm />
        </TacticalPanel>
      </div>
    </main>
  );
}

export default PublishEventPage;
