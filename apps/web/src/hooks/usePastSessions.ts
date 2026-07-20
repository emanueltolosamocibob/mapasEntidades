import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { isSessionClosed } from "../lib/sessionStatus";

export type PastSession = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: string;
  created_at: string;
  expires_at: string;
};

type PastSessionsState =
  | { status: "loading" }
  | { status: "ready"; sessions: PastSession[] }
  | { status: "error"; message: string };

export function usePastSessions() {
  const [state, setState] = useState<PastSessionsState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });

    // RLS ya limita el resultado a sesiones donde soy host o participante
    // aceptado (0003_rls_policies.sql) — no hace falta filtrar por usuario acá.
    const { data, error } = await supabase
      .from("sessions")
      .select("id, code, name, host_id, status, created_at, expires_at")
      .order("created_at", { ascending: false });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "ready", sessions: (data ?? []).filter(isSessionClosed) });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
