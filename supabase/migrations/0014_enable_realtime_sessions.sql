-- ============================================================
-- 0014_enable_realtime_sessions.sql
-- Sin esto, postgres_changes sobre "sessions" nunca dispara (mismo
-- gotcha que airsoft_participants en 0007 y positions en 0008): un
-- jugador ya en /play no se enteraba si el anfitrión cerraba la
-- sesión hasta recargar la página a mano.
-- ============================================================

alter publication supabase_realtime add table sessions;
