type SessionLike = { status: string; expires_at: string | null };

// expires_at es null mientras la sesión es un evento sin iniciar (Fase 7,
// started_at is null) -- nunca vence por tiempo hasta que el host lo activa
// (start_session recién ahí le fija expires_at). Antes de esto, `new
// Date(null)` daba 1970, tratando cualquier evento publicado como cerrado
// al instante.
export function isSessionClosed(session: SessionLike) {
  return (
    session.status === "closed" ||
    (session.expires_at !== null && new Date(session.expires_at) <= new Date())
  );
}
