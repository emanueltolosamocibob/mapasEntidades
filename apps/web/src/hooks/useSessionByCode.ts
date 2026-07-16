import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Session = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: string;
};

type SessionByCodeState =
  | { status: "loading" }
  | { status: "found"; session: Session }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function useSessionByCode(code: string | undefined) {
  const [state, setState] = useState<SessionByCodeState>({ status: "loading" });

  useEffect(() => {
    if (!code) {
      setState({ status: "not-found" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    supabase
      .from("sessions")
      .select("id, code, name, host_id, status")
      .eq("code", code)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: "error", message: error.message });
          return;
        }
        if (!data) {
          setState({ status: "not-found" });
          return;
        }
        setState({ status: "found", session: data });
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  return state;
}
