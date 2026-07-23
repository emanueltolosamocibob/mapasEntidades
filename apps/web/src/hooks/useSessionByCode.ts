import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Session = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  movement_radius_m: number | null;
  description: string | null;
};

type SessionByCodeState =
  | { status: "loading" }
  | { status: "found"; session: Session }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function useSessionByCode(code: string | undefined) {
  const [state, setState] = useState<SessionByCodeState>({ status: "loading" });

  const refresh = useCallback(async () => {
    if (!code) {
      setState({ status: "not-found" });
      return;
    }

    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, code, name, host_id, status, started_at, expires_at, origin_lat, origin_lng, movement_radius_m, description"
      )
      .eq("code", code)
      .maybeSingle();

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }
    if (!data) {
      setState({ status: "not-found" });
      return;
    }
    setState({ status: "found", session: data });
  }, [code]);

  useEffect(() => {
    if (!code) {
      setState({ status: "not-found" });
      return;
    }

    setState({ status: "loading" });
    refresh();

    // Sin esto, un jugador ya en /play no se entera si el anfitrión
    // cierra la sesión hasta que recargue la página a mano.
    const channel = supabase
      .channel(`session:${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `code=eq.${code}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, refresh]);

  return state;
}
