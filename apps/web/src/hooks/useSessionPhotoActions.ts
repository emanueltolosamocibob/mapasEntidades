import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SessionPhoto } from "./useSessionPhotos";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// La portada siempre es imagen (se usa como banner). Los documentos además
// aceptan PDF y Word -- reglamentos, planos del campo, etc.
const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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

    const isImage = file.type.startsWith("image/");
    const isAllowedDocument = kind === "document" && DOCUMENT_MIME_TYPES.includes(file.type);
    if (!isImage && !isAllowedDocument) {
      const message =
        kind === "document"
          ? "Solo se pueden subir imágenes, PDF o Word."
          : "Solo se pueden subir imágenes.";
      setError(message);
      return { ok: false, error: message };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const message = "El archivo no puede pesar más de 5MB.";
      setError(message);
      return { ok: false, error: message };
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
      return { ok: false, error: uploadError.message };
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
      return { ok: false, error: insertError.message };
    }
    return { ok: true, error: null };
  }

  return { uploadPhoto, deletePhoto, uploading, error };
}
