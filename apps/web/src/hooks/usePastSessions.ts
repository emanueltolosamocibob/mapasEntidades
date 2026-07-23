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
  expires_at: string | null;
  kind: string;
  winner_team_name: string | null;
};

type PastSessionRow = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  kind: string;
  winner_team: { name: string } | null;
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
    // aceptado (0003_rls_policies.sql) -- no hace falta filtrar por usuario
    // acá, y no distingue por kind, así que los eventos a los que asistí ya
    // vienen incluidos junto con las partidas rápidas (MAP-68).
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, code, name, host_id, status, created_at, expires_at, kind, winner_team:airsoft_teams!winner_team_id(name)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    const rows = (data ?? []) as unknown as PastSessionRow[];
    setState({
      status: "ready",
      sessions: rows.filter(isSessionClosed).map((row) => ({
        ...row,
        winner_team_name: row.winner_team?.name ?? null,
      })),
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
