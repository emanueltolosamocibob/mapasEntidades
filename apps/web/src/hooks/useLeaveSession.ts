import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLeaveSession() {
  const [loading, setLoading] = useState(false);

  async function leaveSession(participantId: string) {
    setLoading(true);
    await supabase.rpc("leave_session", { p_participant_id: participantId });
    setLoading(false);
  }

  return { leaveSession, loading };
}
