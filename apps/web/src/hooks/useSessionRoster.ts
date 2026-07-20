import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type RosterEntry = {
  participant_id: string;
  nickname: string;
  role: string;
  team_id: string | null;
  team_name: string | null;
  team_color: string | null;
};

type RosterState =
  | { status: "loading" }
  | { status: "ready"; roster: RosterEntry[] }
  | { status: "error"; message: string };

export function useSessionRoster(sessionId: string | undefined) {
  const [state, setState] = useState<RosterState>({ status: "loading" });

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    setState({ status: "loading" });

    supabase
      .rpc("export_session_roster", { p_session_id: sessionId })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: "error", message: error.message });
          return;
        }
        setState({ status: "ready", roster: (data ?? []) as RosterEntry[] });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return state;
}
