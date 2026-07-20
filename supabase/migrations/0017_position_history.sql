-- ============================================================
-- 0017_position_history.sql
-- MAP-25: historial completo de posiciones (no solo la última,
-- a diferencia de "latest_positions" en 0008) con nickname y
-- equipo resueltos, para alimentar el replay (MAP-27) y el
-- export a KML (MAP-28).
--
-- security_invoker hace que respete las mismas policies de RLS
-- que "positions" (0003_rls_policies.sql): el host ve todas las
-- posiciones de su sesión, un jugador solo las de su propio
-- equipo — misma regla que ya aplica en vivo, sin escribir
-- ninguna policy nueva.
--
-- Igual que en 0002, esta vista es específica del dominio airsoft
-- (nickname/equipo vía airsoft_participants); si el día de mañana
-- se agrega el dominio de transporte urbano, necesita su propia
-- vista de historial en vez de extender esta.
-- ============================================================

create view position_history
with (security_invoker = true)
as
select
  e.session_id,
  p.entity_id,
  ap.nickname,
  ap.team_id,
  t.name as team_name,
  t.color as team_color,
  p.geom,
  p.accuracy_m,
  p.recorded_at
from positions p
join entities e on e.id = p.entity_id
join airsoft_participants ap on ap.entity_id = p.entity_id
left join airsoft_teams t on t.id = ap.team_id
order by p.entity_id, p.recorded_at;
