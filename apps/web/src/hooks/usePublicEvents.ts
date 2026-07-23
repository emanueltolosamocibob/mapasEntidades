import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type PublicEvent = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  coverPhotoUrl: string | null;
};

type PublicEventsState =
  | { status: "loading" }
  | { status: "ready"; events: PublicEvent[] }
  | { status: "error"; message: string };

type PublicEventRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
  cover_photo_path: string | null;
};

// list_public_events() (0040) es security definer, acotada a sesiones
// started_at is null -- no hace falta RLS especial acá, la función ya
// resuelve qué es "público".
export function usePublicEvents() {
  const [state, setState] = useState<PublicEventsState>({ status: "loading" });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("list_public_events");

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({
      status: "ready",
      events: ((data ?? []) as PublicEventRow[]).map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        coverPhotoUrl: row.cover_photo_path
          ? supabase.storage.from("session-photos").getPublicUrl(row.cover_photo_path).data
              .publicUrl
          : null,
      })),
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
