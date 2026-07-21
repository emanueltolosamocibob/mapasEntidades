import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const FAILURE_THRESHOLD = 3;

export function useSendPosition(entityId: string | null | undefined, intervalMs: number) {
  const [hasError, setHasError] = useState(false);
  const failureCountRef = useRef(0);

  useEffect(() => {
    if (!entityId || !navigator.geolocation) return;

    failureCountRef.current = 0;
    setHasError(false);

    function onSuccess() {
      failureCountRef.current = 0;
      setHasError(false);
    }

    function onFailure(message: string, err: unknown) {
      console.error(message, err);
      failureCountRef.current += 1;
      if (failureCountRef.current >= FAILURE_THRESHOLD) {
        setHasError(true);
      }
    }

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
            onFailure("No se pudo enviar la posición:", error.message);
          } else {
            onSuccess();
          }
        },
        (error) => {
          onFailure("No se pudo obtener la ubicación:", error.message);
        },
        { enableHighAccuracy: true }
      );
    }

    sendPosition();
    const interval = setInterval(sendPosition, intervalMs);

    return () => clearInterval(interval);
  }, [entityId, intervalMs]);

  return { hasError };
}
