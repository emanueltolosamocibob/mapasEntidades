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
  // "submitted" cubre tanto el caso pending (partida rápida, o evento sin
  // equipo elegido) como accepted-al-toque (evento con p_team_id y cupo
  // disponible, MAP-66) -- distinguirlos es responsabilidad de quien
  // consume el hook, mirando participant.status.
  | { status: "submitted"; participant: Participant }
  | { status: "error"; message: string };

export function useJoinSession() {
  const [state, setState] = useState<JoinSessionState>({ status: "idle" });

  async function joinSession(code: string, nickname: string, role: string, teamId?: string) {
    setState({ status: "loading" });

    const { data, error } = await supabase.rpc("request_join", {
      p_code: code,
      p_nickname: nickname,
      p_role: role,
      ...(teamId ? { p_team_id: teamId } : {}),
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "submitted", participant: data as Participant });
  }

  return { state, joinSession };
}
