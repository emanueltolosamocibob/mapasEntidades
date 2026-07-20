import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type PlayStats = {
  matches_played: number;
  hours_played: number;
  distance_km: number;
};

type PlayStatsState =
  | { status: "loading" }
  | { status: "ready"; stats: PlayStats }
  | { status: "error"; message: string };

export function usePlayStats(userId: string | undefined) {
  const [state, setState] = useState<PlayStatsState>({ status: "loading" });

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setState({ status: "loading" });

    supabase
      .rpc("get_my_play_stats")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: "error", message: error.message });
          return;
        }
        setState({
          status: "ready",
          stats: data?.[0] ?? { matches_played: 0, hours_played: 0, distance_km: 0 },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}
