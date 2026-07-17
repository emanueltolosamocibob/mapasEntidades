import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCloseSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function closeSession(sessionId: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("close_session", {
      p_session_id: sessionId,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  return { closeSession, loading, error };
}
