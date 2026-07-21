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

    const { data } = await supabase
      .from("sessions")
      .select("id, code, name, status, expires_at")
      .eq("host_id", userId)
      .neq("status", "closed")
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
