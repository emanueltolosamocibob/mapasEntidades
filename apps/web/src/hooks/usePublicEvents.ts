import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type PublicEvent = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  coverPhotoUrl: string | null;
  startedAt: string | null;
  status: string;
  hasOpenSlots: boolean;
  acceptedCount: number;
  totalCapacity: number | null;
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
  started_at: string | null;
  status: string;
  has_open_slots: boolean;
  accepted_count: number;
  total_capacity: number | null;
};

// list_public_events() (0040/0043) es security definer -- ya resuelve del
// lado del server qué es "público" (kind='event', abiertos/en curso/
// cerrados recientes) y si hay cupo, no hace falta lógica extra acá.
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
        startedAt: row.started_at,
        status: row.status,
        hasOpenSlots: row.has_open_slots,
        acceptedCount: row.accepted_count,
        totalCapacity: row.total_capacity,
      })),
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
