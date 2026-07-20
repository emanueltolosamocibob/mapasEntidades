import { Link } from "react-router";
import PastSessionsTable from "../components/PastSessionsTable";
import TacticalPanel from "../components/TacticalPanel";
import { useSession } from "../contexts/SessionContext";
import { usePastSessions } from "../hooks/usePastSessions";

function AccountPage() {
  const session = useSession();
  const { state: pastSessions } = usePastSessions();

  if (session.status !== "ready") return null;

  if (session.isAnonymous) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Iniciá sesión con Google desde la pantalla principal para gestionar tu usuario.
        </p>
        <Link to="/" className="text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="tactical-grid min-h-svh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-border pb-6">
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Mi usuario</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {session.user.email}
          </h1>
        </header>

        <TacticalPanel title="Partidas jugadas">
          {pastSessions.status === "loading" && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}
          {pastSessions.status === "error" && (
            <p className="text-sm text-destructive">{pastSessions.message}</p>
          )}
          {pastSessions.status === "ready" && (
            <PastSessionsTable sessions={pastSessions.sessions} currentUserId={session.user.id} />
          )}
        </TacticalPanel>

        <Link
          to="/"
          className="mt-6 inline-block text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

export default AccountPage;
