import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { buildReplayTracks, type PositionHistoryRow, type ReplayTracks } from "../lib/replayEngine";

type ReplayDataState =
  | { status: "loading" }
  | { status: "ready"; tracks: ReplayTracks }
  | { status: "error"; message: string };

export function useReplayData(sessionId: string | undefined) {
  const [state, setState] = useState<ReplayDataState>({ status: "loading" });

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    setState({ status: "loading" });

    supabase
      .rpc("export_session_positions", { p_session_id: sessionId })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: "error", message: error.message });
          return;
        }
        setState({ status: "ready", tracks: buildReplayTracks((data ?? []) as PositionHistoryRow[]) });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return state;
}
