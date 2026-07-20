import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { sessionToKml } from "../lib/kmlExport";
import type { PositionHistoryRow } from "../lib/replayEngine";

type ExportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; kml: string }
  | { status: "error"; message: string };

export function useSessionExportKml() {
  const [state, setState] = useState<ExportState>({ status: "idle" });

  async function exportSession(sessionId: string, sessionName: string) {
    setState({ status: "loading" });

    const { data, error } = await supabase.rpc("export_session_positions", {
      p_session_id: sessionId,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    const kml = sessionToKml(sessionName, (data ?? []) as PositionHistoryRow[]);
    setState({ status: "success", kml });
  }

  return { state, exportSession };
}
