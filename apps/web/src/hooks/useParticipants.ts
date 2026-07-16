import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Participant = {
  id: string;
  nickname: string;
  status: string;
  team_id: string | null;
  requested_at: string;
};

export function useParticipants(sessionId: string | undefined) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const refresh = useCallback(() => {
    if (!sessionId) return;
    supabase
      .from("airsoft_participants")
      .select("id, nickname, status, team_id, requested_at")
      .eq("session_id", sessionId)
      .order("requested_at", { ascending: true })
      .then(({ data }) => {
        if (data) setParticipants(data);
      });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    refresh();

    const channel = supabase
      .channel(`airsoft_participants:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "airsoft_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return { participants };
}
