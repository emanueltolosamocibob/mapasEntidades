import { useState } from "react";
import { linkGoogleAccount } from "../lib/supabaseClient";
import { Button } from "./ui/button";

function GoogleSignInDialog({
  open,
  message,
  onCancel,
}: {
  open: boolean;
  message: string;
  onCancel: () => void;
}) {
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/80 p-4">
      <div className="relative w-full max-w-sm border border-primary bg-card p-6">
        <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
        <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
        <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
        <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

        <p className="mb-2 text-xs tracking-[0.2em] text-primary uppercase">Iniciar sesión</p>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>

        {error && <p className="mb-4 text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={linking}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleLogin} disabled={linking}>
            {linking ? "Redirigiendo..." : "Iniciar sesión con Google"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GoogleSignInDialog;
