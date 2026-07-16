import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Session = {
  id: string;
  code: string;
  name: string;
  session_type: string;
  status: string;
  expires_at: string;
};

type CreateSessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; session: Session }
  | { status: "error"; message: string };

export function useCreateSession() {
  const [state, setState] = useState<CreateSessionState>({ status: "idle" });

  async function createSession(name: string, teamNames: string[]) {
    setState({ status: "loading" });

    const { data, error } = await supabase.rpc("create_session", {
      p_name: name,
      p_session_type: "airsoft",
      p_team_names: teamNames,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "success", session: data as Session });
  }

  return { state, createSession };
}
