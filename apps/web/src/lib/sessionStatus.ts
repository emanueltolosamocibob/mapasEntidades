type SessionLike = { status: string; expires_at: string };

export function isSessionClosed(session: SessionLike) {
  return session.status === "closed" || new Date(session.expires_at) <= new Date();
}
