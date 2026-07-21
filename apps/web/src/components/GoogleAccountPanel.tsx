import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSession } from "../contexts/SessionContext";
import { consumeOAuthRedirectError, linkGoogleAccount, signInWithGoogle } from "../lib/supabaseClient";
import { Button } from "./ui/button";

function GoogleAccountPanel() {
  const session = useSession();
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = consumeOAuthRedirectError();
    if (!oauthError) return;

    if (oauthError.code === "identity_already_exists") {
      setLinking(true);
      signInWithGoogle().catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google.");
        setLinking(false);
      });
      return;
    }

    setError(oauthError.description || "No se pudo iniciar sesión con Google.");
  }, []);

  if (session.status !== "ready") return null;

  async function handleLogin() {
    setError(null);
    setLinking(true);
    try {
      await linkGoogleAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google.");
      setLinking(false);
    }
  }

  if (session.isAnonymous) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Iniciá sesión con Google para acceder al historial de tus partidas.
        </p>
        <Button type="button" className="w-full" disabled={linking} onClick={handleLogin}>
          {linking ? "Redirigiendo..." : "Iniciar sesión con Google"}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Sesión iniciada como{" "}
        <span className="text-foreground">{session.user.email}</span>.
      </p>
      <Button className="w-full" nativeButton={false} render={<Link to="/account" />}>
        Gestionar mi usuario
      </Button>
    </div>
  );
}

export default GoogleAccountPanel;
