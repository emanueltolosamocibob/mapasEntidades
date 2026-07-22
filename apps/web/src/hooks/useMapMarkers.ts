import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { MapMarkerIconType } from "../lib/tacticalIcon";

export type MapMarker = {
  id: string;
  teamId: string;
  createdBy: string;
  iconType: MapMarkerIconType;
  label: string | null;
  lat: number;
  lng: number;
};

export function useMapMarkers(sessionId: string | undefined) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from("map_markers")
      .select("id, team_id, created_by, icon_type, label, lat, lng")
      .eq("session_id", sessionId);

    setMarkers(
      (data ?? []).map((row) => ({
        id: row.id,
        teamId: row.team_id,
        createdBy: row.created_by,
        iconType: row.icon_type as MapMarkerIconType,
        label: row.label,
        lat: row.lat,
        lng: row.lng,
      }))
    );
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    refresh();

    const channel = supabase
      .channel(`map-markers:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_markers",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return { markers };
}
