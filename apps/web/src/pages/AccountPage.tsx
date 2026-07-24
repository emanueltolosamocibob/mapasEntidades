import { Link } from "react-router";
import PastSessionsTable from "../components/PastSessionsTable";
import StatsPanel from "../components/StatsPanel";
import TacticalPanel from "../components/TacticalPanel";
import UserInfoPanel from "../components/UserInfoPanel";
import { Button } from "../components/ui/button";
import { useSession } from "../contexts/SessionContext";
import { usePastSessions } from "../hooks/usePastSessions";
import { usePlayStats } from "../hooks/usePlayStats";
import { supabase } from "../lib/supabaseClient";

// Reload completo a propósito: SessionContext solo reacciona a
// onAuthStateChange cuando hay un session.user (ver su useEffect), así
// que un sign-out no lo actualiza solo. El reload fuerza a
// ensureAnonymousSession() a arrancar de cero y crear una sesión
// anónima nueva y limpia.
async function handleSignOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

function AccountPage() {
  const session = useSession();
  const { state: pastSessions } = usePastSessions();
  const userId = session.status === "ready" ? session.user.id : undefined;
  const playStats = usePlayStats(userId);

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
          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {session.user.email}
          </h1>
        </header>

        <TacticalPanel title="Información" className="mb-6">
          <UserInfoPanel
            userId={session.user.id}
            defaultDisplayName={
              (session.user.user_metadata?.full_name as string | undefined) ??
              (session.user.user_metadata?.name as string | undefined) ??
              null
            }
          />
        </TacticalPanel>

        <TacticalPanel title="Estadísticas" className="mb-6">
          {playStats.status === "loading" && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}
          {playStats.status === "error" && (
            <p className="text-sm text-destructive">{playStats.message}</p>
          )}
          {playStats.status === "ready" && <StatsPanel stats={playStats.stats} />}
        </TacticalPanel>

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

        <div className="mt-6 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            Volver al inicio
          </Link>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </main>
  );
}

export default AccountPage;
