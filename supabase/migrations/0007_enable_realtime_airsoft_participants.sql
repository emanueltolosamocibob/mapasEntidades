-- ============================================================
-- 0007_enable_realtime_airsoft_participants.sql
-- Habilita eventos de Realtime (postgres_changes) para
-- airsoft_participants. Sin esto, las suscripciones del cliente
-- (docs/ARCHITECTURE.md 9.4) nunca reciben INSERT/UPDATE en vivo:
-- Supabase solo emite cambios de tablas agregadas explícitamente
-- a la publicación supabase_realtime.
-- ============================================================

alter publication supabase_realtime add table airsoft_participants;
