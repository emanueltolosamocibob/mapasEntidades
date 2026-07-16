-- ============================================================
-- 0008_positions_view_and_realtime.sql
-- Soporte para el mapa en vivo (MAP-14):
-- - Vista "latest_positions": la última posición conocida por
--   entidad, para la carga inicial del mapa. security_invoker
--   hace que respete las mismas policies de RLS que "positions"
--   (RF-11, visibilidad por equipo) — no es una puerta trasera.
-- - Habilita Realtime en "positions" (mismo gotcha que
--   airsoft_participants en 0007: sin esto, postgres_changes
--   nunca dispara).
-- ============================================================

create view latest_positions
with (security_invoker = true)
as
select distinct on (entity_id)
  entity_id,
  geom,
  accuracy_m,
  recorded_at
from positions
order by entity_id, recorded_at desc;

alter publication supabase_realtime add table positions;
