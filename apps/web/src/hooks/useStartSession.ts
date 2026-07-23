import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useStartSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession(sessionId: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("start_session", {
      p_session_id: sessionId,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  return { startSession, loading, error };
}
