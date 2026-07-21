import { useEffect } from "react";

// Mitigación parcial para MAP-51: evita que la pantalla se apague sola
// por inactividad mientras la pestaña está en foco. No evita nada si
// el jugador bloquea la pantalla a mano (el wake lock se libera solo
// en cuanto la pestaña deja de estar visible, sea cual sea la razón) —
// para eso hace falta una app nativa, no es solucionable desde acá.
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function requestLock() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // el navegador puede rechazar el pedido (ej. batería baja, o la
        // pestaña ya no está visible en ese instante) -- no es crítico.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !cancelled) {
        requestLock();
      }
    }

    requestLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [enabled]);
}
