import { useRef, type ChangeEvent } from "react";
import { FileText, X } from "lucide-react";
import { useSessionPhotos } from "../hooks/useSessionPhotos";
import { useSessionPhotoActions } from "../hooks/useSessionPhotoActions";
import { getDocumentKind } from "../lib/documentKind";
import { Button } from "./ui/button";

const DOCUMENT_ACCEPT =
  "image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function SessionPhotosPanel({ sessionId }: { sessionId: string }) {
  const { photos, refresh } = useSessionPhotos(sessionId);
  const { uploadPhoto, deletePhoto, uploading, error } = useSessionPhotoActions();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const cover = photos.find((photo) => photo.kind === "cover") ?? null;
  const documents = photos.filter((photo) => photo.kind === "document");

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const { ok } = await uploadPhoto(sessionId, file, "cover", cover);
    if (ok) refresh();
  }

  async function handleDocumentsChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    for (const file of files) {
      await uploadPhoto(sessionId, file, "document");
    }
    refresh();
  }

  async function handleRemove(photo: (typeof photos)[number]) {
    const ok = await deletePhoto(photo);
    if (ok) refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-muted-foreground uppercase">Portada</p>
        {cover ? (
          <div className="relative">
            <img
              src={cover.url}
              alt=""
              className="h-40 w-full border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(cover)}
              aria-label="Quitar portada"
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center border border-destructive bg-background/90 text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin portada todavía.</p>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={uploading}
          onClick={() => coverInputRef.current?.click()}
        >
          {cover ? "Reemplazar portada" : "Subir portada"}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Documentos
        </p>
        {documents.length > 0 && (
          <div className="mb-2 grid grid-cols-3 gap-2">
            {documents.map((doc) => {
              const kind = getDocumentKind(doc.storagePath);
              return (
                <div key={doc.id} className="relative">
                  {kind === "image" ? (
                    <img
                      src={doc.url}
                      alt=""
                      className="h-24 w-full border border-border object-cover"
                    />
                  ) : (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-24 w-full flex-col items-center justify-center gap-1 border border-border text-muted-foreground hover:border-primary"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-[10px] tracking-[0.1em] uppercase">
                        {kind === "pdf" ? "PDF" : "Word"}
                      </span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(doc)}
                    aria-label="Quitar documento"
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center border border-destructive bg-background/90 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <input
          ref={documentInputRef}
          type="file"
          accept={DOCUMENT_ACCEPT}
          multiple
          className="hidden"
          onChange={handleDocumentsChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => documentInputRef.current?.click()}
        >
          + Agregar documento
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default SessionPhotosPanel;
