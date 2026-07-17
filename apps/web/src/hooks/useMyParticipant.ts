import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type MyParticipant = {
  id: string;
  status: string;
  entity_id: string | null;
  team_id: string | null;
};

export function useMyParticipant(
  sessionId: string | undefined,
  userId: string | undefined
) {
  const [participant, setParticipant] = useState<MyParticipant | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionId || !userId) return;

    // Un mismo user_id puede tener más de una fila en la sesión con el
    // tiempo (ej. salió y volvió a pedir ingreso) — status='kicked' de la
    // vez anterior no bloquea un nuevo pending por el índice único parcial.
    // .maybeSingle() rompía con "multiple rows returned" en ese caso;
    // acá nos quedamos con la más reciente.
    const { data } = await supabase
      .from("airsoft_participants")
      .select("id, status, entity_id, team_id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .limit(1);

    setParticipant(data?.[0] ?? null);
  }, [sessionId, userId]);

  useEffect(() => {
    if (!sessionId || !userId) return;

    refresh();

    const channel = supabase
      .channel(`my-participant:${sessionId}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "airsoft_participants",
          filter: `user_id=eq.${userId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, refresh]);

  return participant;
}
