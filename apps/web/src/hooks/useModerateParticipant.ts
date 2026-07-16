import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useModerateParticipant() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(requestId: string, teamId: string) {
    setPendingId(requestId);
    setError(null);
    const { error } = await supabase.rpc("accept_participant", {
      p_request_id: requestId,
      p_team_id: teamId,
    });
    setPendingId(null);
    if (error) setError(error.message);
  }

  async function reject(requestId: string) {
    setPendingId(requestId);
    setError(null);
    const { error } = await supabase.rpc("reject_participant", {
      p_request_id: requestId,
    });
    setPendingId(null);
    if (error) setError(error.message);
  }

  async function reassignTeam(participantId: string, teamId: string) {
    setPendingId(participantId);
    setError(null);
    const { error } = await supabase.rpc("reassign_team", {
      p_participant_id: participantId,
      p_team_id: teamId,
    });
    setPendingId(null);
    if (error) setError(error.message);
  }

  async function kick(participantId: string) {
    setPendingId(participantId);
    setError(null);
    const { error } = await supabase.rpc("kick_participant", {
      p_participant_id: participantId,
    });
    setPendingId(null);
    if (error) setError(error.message);
  }

  return { accept, reject, reassignTeam, kick, pendingId, error };
}
