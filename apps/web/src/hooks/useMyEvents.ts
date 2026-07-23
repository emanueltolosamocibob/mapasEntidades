import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type MyEvent = {
  id: string;
  code: string;
  name: string;
  status: string;
  started_at: string | null;
  created_at: string;
};

type MyEventsState =
  | { status: "loading" }
  | { status: "ready"; events: MyEvent[] }
  | { status: "error"; message: string };

// La policy de sessions ya permite host_id = auth.uid() sin RLS especial
// (0006) -- alcanza con filtrar acá por kind='event' y el propio user id,
// no hace falta una RPC nueva.
export function useMyEvents(userId: string | undefined) {
  const [state, setState] = useState<MyEventsState>({ status: "loading" });

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ status: "ready", events: [] });
      return;
    }

    setState({ status: "loading" });
    const { data, error } = await supabase
      .from("sessions")
      .select("id, code, name, status, started_at, created_at")
      .eq("kind", "event")
      .eq("host_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "ready", events: data ?? [] });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
