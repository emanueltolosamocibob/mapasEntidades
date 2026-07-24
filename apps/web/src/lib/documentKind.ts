// El nombre subido va al final del storage_path (ver useSessionPhotoActions:
// "{sessionId}/{uuid}-{file.name}"), así que la extensión alcanza para saber
// cómo mostrarlo -- no hace falta guardar el mimetype aparte.
export type DocumentKind = "image" | "pdf" | "office";

export function getDocumentKind(storagePath: string): DocumentKind {
  const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "office";
  return "image";
}
