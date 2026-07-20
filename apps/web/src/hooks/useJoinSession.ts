import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Participant = {
  id: string;
  session_id: string;
  nickname: string;
  role: string;
  status: string;
};

type JoinSessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "pending"; participant: Participant }
  | { status: "error"; message: string };

export function useJoinSession() {
  const [state, setState] = useState<JoinSessionState>({ status: "idle" });

  async function joinSession(code: string, nickname: string, role: string) {
    setState({ status: "loading" });

    const { data, error } = await supabase.rpc("request_join", {
      p_code: code,
      p_nickname: nickname,
      p_role: role,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "pending", participant: data as Participant });
  }

  return { state, joinSession };
}
