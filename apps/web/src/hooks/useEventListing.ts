import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type EventListingTeam = {
  id: string;
  name: string;
  color: string | null;
  maxPlayers: number | null;
  acceptedCount: number;
  players: string[];
};

export type EventListingPhoto = {
  storagePath: string;
  kind: "cover" | "document";
  sortOrder: number;
  url: string;
};

export type EventListingMarker = {
  iconType: string;
  label: string | null;
  lat: number;
  lng: number;
};

export type EventListing = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  startedAt: string | null;
  status: string;
  originLat: number | null;
  originLng: number | null;
  movementRadiusM: number | null;
  photos: EventListingPhoto[];
  teams: EventListingTeam[];
  markers: EventListingMarker[];
};

type EventListingState =
  | { status: "loading" }
  | { status: "found"; event: EventListing }
  | { status: "not-found" }
  | { status: "error"; message: string };

// get_session_listing() (0040/0044) es security definer, acotada del
// mismo modo que list_public_events() (kind='event', abierto/en curso/
// cerrado reciente) -- devuelve todo en un solo jsonb, no hace falta
// más de un round-trip ni RLS especial acá.
export function useEventListing(code: string | undefined) {
  const [state, setState] = useState<EventListingState>({ status: "loading" });

  const refresh = useCallback(async () => {
    if (!code) {
      setState({ status: "not-found" });
      return;
    }

    setState({ status: "loading" });
    const { data, error } = await supabase.rpc("get_session_listing", { p_code: code });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }
    if (!data) {
      setState({ status: "not-found" });
      return;
    }

    const raw = data as Omit<EventListing, "photos"> & {
      photos: Omit<EventListingPhoto, "url">[];
    };

    setState({
      status: "found",
      event: {
        ...raw,
        photos: raw.photos.map((photo) => ({
          ...photo,
          url: supabase.storage.from("session-photos").getPublicUrl(photo.storagePath).data
            .publicUrl,
        })),
      },
    });
  }, [code]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
