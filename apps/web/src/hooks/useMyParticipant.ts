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

    const { data } = await supabase
      .from("airsoft_participants")
      .select("id, status, entity_id, team_id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    setParticipant(data ?? null);
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
