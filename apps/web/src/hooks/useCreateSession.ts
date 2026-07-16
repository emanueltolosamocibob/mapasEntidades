import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Session = {
  id: string;
  code: string;
  name: string;
  session_type: string;
  status: string;
  expires_at: string;
  origin_lat: number | null;
  origin_lng: number | null;
  movement_radius_m: number | null;
};

type CreateSessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; session: Session }
  | { status: "error"; message: string };

type Origin = { lat: number; lng: number } | null;

export function useCreateSession() {
  const [state, setState] = useState<CreateSessionState>({ status: "idle" });

  async function createSession(
    name: string,
    teamNames: string[],
    origin: Origin,
    movementRadiusM: number | null
  ) {
    setState({ status: "loading" });

    const { data, error } = await supabase.rpc("create_session", {
      p_name: name,
      p_session_type: "airsoft",
      p_team_names: teamNames,
      p_origin_lat: origin?.lat ?? null,
      p_origin_lng: origin?.lng ?? null,
      p_movement_radius_m: movementRadiusM,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "success", session: data as Session });
  }

  return { state, createSession };
}
