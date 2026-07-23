import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type SessionPhoto = {
  id: string;
  storagePath: string;
  kind: "cover" | "document";
  sortOrder: number;
  url: string;
};

export function useSessionPhotos(sessionId: string | undefined) {
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from("session_photos")
      .select("id, storage_path, kind, sort_order")
      .eq("session_id", sessionId)
      .order("sort_order", { ascending: true });

    setPhotos(
      (data ?? []).map((row) => ({
        id: row.id,
        storagePath: row.storage_path,
        kind: row.kind as "cover" | "document",
        sortOrder: row.sort_order,
        url: supabase.storage.from("session-photos").getPublicUrl(row.storage_path).data
          .publicUrl,
      }))
    );
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { photos, refresh };
}
