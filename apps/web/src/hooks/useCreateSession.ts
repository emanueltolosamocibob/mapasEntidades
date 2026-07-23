import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Session = {
  id: string;
  code: string;
  name: string;
  session_type: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  movement_radius_m: number | null;
  description: string | null;
};

type CreateSessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; session: Session }
  | { status: "error"; message: string };

type Origin = { lat: number; lng: number } | null;
type Team = { name: string; maxPlayers: number | null };

export function useCreateSession() {
  const [state, setState] = useState<CreateSessionState>({ status: "idle" });

  async function createSession(params: {
    name: string;
    teams: Team[];
    origin: Origin;
    movementRadiusM: number | null;
    description?: string | null;
    startNow?: boolean;
  }) {
    setState({ status: "loading" });

    const { data, error } = await supabase.rpc("create_session", {
      p_name: params.name,
      p_session_type: "airsoft",
      p_team_names: params.teams.map((t) => t.name),
      p_team_max_players: params.teams.map((t) => t.maxPlayers),
      p_origin_lat: params.origin?.lat ?? null,
      p_origin_lng: params.origin?.lng ?? null,
      p_movement_radius_m: params.movementRadiusM,
      p_description: params.description ?? null,
      p_start_now: params.startNow ?? true,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "success", session: data as Session });
  }

  return { state, createSession };
}
