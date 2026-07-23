import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { isSessionClosed } from "../lib/sessionStatus";

type HostedSession = { id: string; code: string; name: string };

export function useMyHostedSession(userId: string | undefined) {
  const [session, setSession] = useState<HostedSession | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSession(null);
      return;
    }

    // started_at is not null -- mismo criterio de "sesión activa" que usa
    // create_session (0043) para bloquear una partida rápida nueva. Sin este
    // filtro, un evento publicado y todavía sin arrancar (o varios a la vez)
    // aparecía acá igual, porque no tiene expires_at hasta que se inicia, y
    // tapaba el formulario de "Crear partida" con el overlay de "partida en
    // curso" sin que hubiera ninguna partida corriendo de verdad.
    const { data } = await supabase
      .from("sessions")
      .select("id, code, name, status, expires_at, started_at")
      .eq("host_id", userId)
      .neq("status", "closed")
      .not("started_at", "is", null)
      .order("created_at", { ascending: false });

    const active = (data ?? []).find((s) => !isSessionClosed(s));
    setSession(active ? { id: active.id, code: active.code, name: active.name } : null);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSession(null);
      return;
    }

    refresh();

    const channel = supabase
      .channel(`hosted-session:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `host_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return session;
}
