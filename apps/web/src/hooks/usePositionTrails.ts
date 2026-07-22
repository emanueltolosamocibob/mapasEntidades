import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const TRAIL_WINDOW_MS = 10 * 60 * 1000;

export type PositionTrail = {
  entityId: string;
  teamId: string | null;
  points: { lat: number; lng: number }[];
};

// "position_history" (0017-0019) ya trae todo lo necesario -- misma vista
// que usa el replay, ya filtrada por RLS de equipo. Acá solo se acota a
// una ventana reciente (no la partida entera) para que la consulta y el
// dibujo del rastro se mantengan livianos en partidas largas.
export function usePositionTrails(sessionId: string | undefined, enabled: boolean) {
  const [trails, setTrails] = useState<PositionTrail[]>([]);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    const requestId = ++requestIdRef.current;

    const cutoff = new Date(Date.now() - TRAIL_WINDOW_MS).toISOString();
    const { data } = await supabase
      .from("position_history")
      .select("entity_id, team_id, lat, lng, recorded_at")
      .eq("session_id", sessionId)
      .gte("recorded_at", cutoff)
      .order("entity_id", { ascending: true })
      .order("recorded_at", { ascending: true });

    if (requestId !== requestIdRef.current) return;

    const byEntity = new Map<string, PositionTrail>();
    for (const row of data ?? []) {
      const entityId = row.entity_id as string;
      let trail = byEntity.get(entityId);
      if (!trail) {
        trail = { entityId, teamId: row.team_id as string | null, points: [] };
        byEntity.set(entityId, trail);
      }
      trail.points.push({ lat: row.lat, lng: row.lng });
    }
    setTrails(Array.from(byEntity.values()));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    refresh();

    const channel = supabase
      .channel(`position-trails:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "positions" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, enabled, refresh]);

  return { trails: enabled ? trails : [] };
}
