import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLeaveSession() {
  const [loading, setLoading] = useState(false);

  // Devuelve true/false en vez de ignorar el resultado -- si el RPC
  // falla en silencio (ver MAP-52), el llamador necesita enterarse en
  // vez de navegar como si hubiera salido bien.
  async function leaveSession(participantId: string) {
    setLoading(true);
    const { error } = await supabase.rpc("leave_session", { p_participant_id: participantId });
    setLoading(false);
    return !error;
  }

  return { leaveSession, loading };
}
