import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const SEND_INTERVAL_MS = 5000;

export function useSendPosition(entityId: string | null | undefined) {
  useEffect(() => {
    if (!entityId || !navigator.geolocation) return;

    function sendPosition() {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const { error } = await supabase.from("positions").insert({
            entity_id: entityId,
            geom: `SRID=4326;POINT(${longitude} ${latitude})`,
            accuracy_m: accuracy,
          });
          if (error) {
            console.error("No se pudo enviar la posición:", error.message);
          }
        },
        (error) => {
          console.error("No se pudo obtener la ubicación:", error.message);
        },
        { enableHighAccuracy: true }
      );
    }

    sendPosition();
    const interval = setInterval(sendPosition, SEND_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [entityId]);
}
