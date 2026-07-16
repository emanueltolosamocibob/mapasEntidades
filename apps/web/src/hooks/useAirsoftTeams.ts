import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Team = { id: string; name: string; color: string | null };

export function useAirsoftTeams(sessionId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    supabase
      .from("airsoft_teams")
      .select("id, name, color")
      .eq("session_id", sessionId)
      .then(({ data }) => {
        if (!cancelled && data) setTeams(data);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return teams;
}
