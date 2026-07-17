import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type RosterMember = { id: string; nickname: string; entityId: string | null };

export function useTeamRoster(sessionId: string | undefined) {
  const [roster, setRoster] = useState<RosterMember[]>([]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from("airsoft_participants")
      .select("id, nickname, entity_id")
      .eq("session_id", sessionId)
      .eq("status", "accepted")
      .order("nickname");

    if (data) {
      setRoster(data.map((p) => ({ id: p.id, nickname: p.nickname, entityId: p.entity_id })));
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    refresh();

    const channel = supabase
      .channel(`roster:${sessionId}`)
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

  return roster;
}
