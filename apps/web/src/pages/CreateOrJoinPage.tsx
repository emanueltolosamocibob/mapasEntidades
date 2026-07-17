import CreateSessionForm from "../components/CreateSessionForm";
import JoinSessionForm from "../components/JoinSessionForm";
import TacticalPanel from "../components/TacticalPanel";

function CreateOrJoinPage() {
  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-border pb-6">
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Sistema de tracking en tiempo real
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            mapas<span className="text-primary">Entidades</span>
          </h1>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <TacticalPanel title="Crear sesión">
            <CreateSessionForm />
          </TacticalPanel>

          <TacticalPanel title="Unirse a sesión">
            <JoinSessionForm />
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default CreateOrJoinPage;
