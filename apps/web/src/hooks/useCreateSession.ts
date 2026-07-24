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

type EventDetails = {
  scheduledAt?: string | null;
  organizerName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  byopCost?: number | null;
  byopDeposit?: number | null;
  rentalCost?: number | null;
  rentalDeposit?: number | null;
  isPublic?: boolean;
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

  async function createSession(
    params: {
      name: string;
      teams: Team[];
      origin: Origin;
      movementRadiusM: number | null;
      description?: string | null;
      startNow?: boolean;
    } & EventDetails
  ) {
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
      p_scheduled_at: params.scheduledAt ?? null,
      p_organizer_name: params.organizerName ?? null,
      p_contact_phone: params.contactPhone ?? null,
      p_address: params.address ?? null,
      p_byop_cost: params.byopCost ?? null,
      p_byop_deposit: params.byopDeposit ?? null,
      p_rental_cost: params.rentalCost ?? null,
      p_rental_deposit: params.rentalDeposit ?? null,
      p_is_public: params.isPublic ?? true,
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return null;
    }

    setState({ status: "success", session: data as Session });
    // Devuelve la sesión además de setear el estado -- PublishEventForm
    // necesita el id recién creado en el mismo submit para subir las fotos
    // elegidas en el formulario (no se pueden subir antes: la policy de
    // Storage exige que la sesión exista y que el que sube sea su host).
    return data as Session;
  }

  return { state, createSession };
}
