import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { MapMarkerIconType } from "../lib/tacticalIcon";

export function useMapMarkerActions() {
  const [error, setError] = useState<string | null>(null);

  async function addMarker(fields: {
    sessionId: string;
    teamId: string;
    userId: string;
    iconType: MapMarkerIconType;
    label: string;
    lat: number;
    lng: number;
  }) {
    setError(null);
    const { error } = await supabase.from("map_markers").insert({
      session_id: fields.sessionId,
      team_id: fields.teamId,
      created_by: fields.userId,
      icon_type: fields.iconType,
      label: fields.label.trim() || null,
      lat: fields.lat,
      lng: fields.lng,
    });
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  async function removeMarker(markerId: string) {
    setError(null);
    const { error } = await supabase.from("map_markers").delete().eq("id", markerId);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  return { addMarker, removeMarker, error };
}
