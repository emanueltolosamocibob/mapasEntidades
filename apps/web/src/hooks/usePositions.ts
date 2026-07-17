import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type PlayerPosition = {
  entityId: string;
  nickname: string;
  lat: number;
  lng: number;
};

export function usePositions(sessionId: string | undefined) {
  const [positions, setPositions] = useState<PlayerPosition[]>([]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;

    const { data: participants } = await supabase
      .from("airsoft_participants")
      .select("entity_id, nickname")
      .eq("session_id", sessionId)
      .eq("status", "accepted")
      .not("entity_id", "is", null);

    if (!participants || participants.length === 0) {
      setPositions([]);
      return;
    }

    const entityIds = participants.map((p) => p.entity_id as string);

    const { data: latest } = await supabase
      .from("latest_positions")
      .select("entity_id, lat, lng")
      .in("entity_id", entityIds);

    const positionByEntity = new Map(
      (latest ?? []).map((p) => [p.entity_id, { lat: p.lat, lng: p.lng }])
    );

    const merged: PlayerPosition[] = participants.flatMap((p) => {
      const pos = positionByEntity.get(p.entity_id as string);
      if (!pos) return [];
      return [
        {
          entityId: p.entity_id as string,
          nickname: p.nickname,
          lat: pos.lat,
          lng: pos.lng,
        },
      ];
    });

    setPositions(merged);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    refresh();

    const channel = supabase
      .channel(`positions:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "positions" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return { positions };
}
