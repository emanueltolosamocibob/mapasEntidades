-- ============================================================
-- 0034_sessions_events_schema.sql
-- Fase 7: soporte para "eventos" (convocatorias publicadas con
-- 1-2 semanas de anticipación) sin tocar el flujo de "partida
-- rápida" que ya existe.
--
-- La distinción entre los dos no necesita una columna de "tipo"
-- nueva -- alcanza con started_at:
--   - Partida rápida: started_at se setea en el momento de crear
--     (create_session con p_start_now=true, default -- ver
--     0036_create_session_events.sql), expires_at = started_at + 5h,
--     igual que el comportamiento actual sin cambios.
--   - Evento: started_at queda null al crear (p_start_now=false),
--     nunca vence, se lista públicamente (ver
--     0041_public_events_rpcs.sql) hasta que el host lo activa
--     con start_session (0037), recién ahí arranca la ventana de
--     5h de RF-16.
--
-- expires_at pasa a nullable: una convocatoria sin iniciar no
-- tiene fecha de vencimiento todavía.
--
-- Backfill: toda sesión existente hoy es, en los hechos, una
-- "partida rápida" ya arrancada -- se le setea started_at =
-- created_at para que isSessionClosed() (client) siga
-- comportándose igual que antes con datos viejos.
-- ============================================================

alter table sessions add column started_at timestamptz;
alter table sessions add column description text;
alter table sessions alter column expires_at drop not null;

update sessions set started_at = created_at where started_at is null;
