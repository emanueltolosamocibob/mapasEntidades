import { useState } from "react";
import { Link } from "react-router";
import CreateSessionForm from "../components/CreateSessionForm";
import GoogleAccountPanel from "../components/GoogleAccountPanel";
import JoinSessionForm from "../components/JoinSessionForm";
import TacticalPanel from "../components/TacticalPanel";
import { Button } from "../components/ui/button";
import { useSession } from "../contexts/SessionContext";
import { useMyHostedSession } from "../hooks/useMyHostedSession";

function CreateOrJoinPage() {
  const session = useSession();
  const userId = session.status === "ready" ? session.user.id : undefined;
  const hostedSession = useMyHostedSession(userId);
  // El overlay es para cuando se vuelve a la home después de haber
  // salido del panel de anfitrión — no para tapar la vista de éxito
  // (código/QR) de la propia creación. Se resetea solo al volver a
  // montar esta página (ej. después de navegar al panel y volver).
  const [justCreated, setJustCreated] = useState(false);

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
          <TacticalPanel title="Unirse a partida">
            <JoinSessionForm />
          </TacticalPanel>

          <TacticalPanel title="Crear partida" className="relative">
            <CreateSessionForm onCreated={() => setJustCreated(true)} />
            {hostedSession && !justCreated && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90 p-4 text-center">
                <p className="text-xs tracking-[0.2em] text-primary uppercase">
                  Partida en curso: {hostedSession.name} ({hostedSession.code})
                </p>
                <Button nativeButton={false} render={<Link to={`/session/${hostedSession.code}/host`} />}>
                  Volver al panel de anfitrión
                </Button>
              </div>
            )}
          </TacticalPanel>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <TacticalPanel title="Cuenta de Google">
            <GoogleAccountPanel />
          </TacticalPanel>

          <TacticalPanel title="¿Problemas para verte en el mapa?" accent="destructive">
            <p className="text-sm text-destructive/90">
              Activá/permití el acceso a tu ubicación en la configuración de tu navegador o
              dispositivo.
            </p>
          </TacticalPanel>
        </div>
      </div>
    </main>
  );
}

export default CreateOrJoinPage;
