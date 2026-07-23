import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SessionPhoto } from "./useSessionPhotos";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Primer uso de Supabase Storage en el proyecto -- sube al bucket publico
// "session-photos" (0039_session_photos.sql) bajo "{sessionId}/{archivo}"
// y despues inserta la fila en session_photos. Portada es unica: subir una
// nueva borra la anterior (fila + objeto del bucket) antes de insertar.
export function useSessionPhotoActions() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deletePhoto(photo: SessionPhoto) {
    setError(null);
    await supabase.storage.from("session-photos").remove([photo.storagePath]);
    const { error: deleteError } = await supabase
      .from("session_photos")
      .delete()
      .eq("id", photo.id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    return true;
  }

  async function uploadPhoto(
    sessionId: string,
    file: File,
    kind: "cover" | "document",
    existingCover?: SessionPhoto | null
  ) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Solo se pueden subir imágenes.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("La imagen no puede pesar más de 5MB.");
      return false;
    }

    setUploading(true);

    if (kind === "cover" && existingCover) {
      await deletePhoto(existingCover);
    }

    const path = `${sessionId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("session-photos").upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return false;
    }

    const { error: insertError } = await supabase.from("session_photos").insert({
      session_id: sessionId,
      storage_path: path,
      kind,
      sort_order: Date.now(),
    });

    setUploading(false);

    if (insertError) {
      setError(insertError.message);
      return false;
    }
    return true;
  }

  return { uploadPhoto, deletePhoto, uploading, error };
}
