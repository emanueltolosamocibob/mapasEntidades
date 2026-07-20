import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type HostJoinState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

export function useHostJoinSession() {
  const [state, setState] = useState<HostJoinState>({ status: "idle" });

  async function hostJoinSession(
    sessionId: string,
    nickname: string,
    teamId: string,
    role: string
  ) {
    setState({ status: "loading" });

    const { error } = await supabase.rpc("host_join_session", {
      p_session_id: sessionId,
      p_nickname: nickname,
      p_team_id: teamId,
      p_role: role,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "success" });
  }

  return { state, hostJoinSession };
}
