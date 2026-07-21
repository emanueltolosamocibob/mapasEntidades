import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type PlayerPosition = {
  entityId: string;
  nickname: string;
  role: string;
  lat: number;
  lng: number;
  recordedAt: string;
};

export function usePositions(sessionId: string | undefined) {
  const [positions, setPositions] = useState<PlayerPosition[]>([]);
  // El listener de INSERT en "positions" no tiene (ni puede tener,
  // la tabla no guarda session_id) filtro por sesión -- cualquier
  // posición nueva de cualquier partida en toda la app dispara un
  // refresh() acá. Si dos llamadas se solapan, pueden resolver en
  // desorden y una respuesta vieja pisar a una más nueva (se veía
  // como el tag de "hace X" parpadeando para atrás). Este contador
  // descarta cualquier respuesta que no sea la del último pedido.
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    const requestId = ++requestIdRef.current;

    const { data: participants } = await supabase
      .from("airsoft_participants")
      .select("entity_id, nickname, role")
      .eq("session_id", sessionId)
      .eq("status", "accepted")
      .not("entity_id", "is", null);

    if (requestId !== requestIdRef.current) return;

    if (!participants || participants.length === 0) {
      setPositions([]);
      return;
    }

    const entityIds = participants.map((p) => p.entity_id as string);

    const { data: latest } = await supabase
      .from("latest_positions")
      .select("entity_id, lat, lng, recorded_at")
      .in("entity_id", entityIds);

    const positionByEntity = new Map(
      (latest ?? []).map((p) => [
        p.entity_id,
        { lat: p.lat, lng: p.lng, recordedAt: p.recorded_at as string },
      ])
    );

    const merged: PlayerPosition[] = participants.flatMap((p) => {
      const pos = positionByEntity.get(p.entity_id as string);
      if (!pos) return [];
      return [
        {
          entityId: p.entity_id as string,
          nickname: p.nickname,
          role: p.role,
          lat: pos.lat,
          lng: pos.lng,
          recordedAt: pos.recordedAt,
        },
      ];
    });

    if (requestId !== requestIdRef.current) return;
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
      // Sin esto, aceptar/expulsar/reasignar de equipo en el panel de
      // anfitrión no actualiza el mapa hasta que llega cualquier
      // posición nueva de otro jugador (refresh() ya recalcula todo
      // desde cero, pero nada disparaba ese recálculo ante un cambio en
      // airsoft_participants) — ver MAP-49.
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "airsoft_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return { positions };
}
