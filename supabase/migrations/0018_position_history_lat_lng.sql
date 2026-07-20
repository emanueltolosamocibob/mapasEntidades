-- ============================================================
-- 0018_position_history_lat_lng.sql
-- Ajusta position_history (0017) para exponer lat/lng como
-- columnas float8 en vez del geography crudo — mismo problema
-- y misma solución que 0009_latest_positions_lat_lng.sql:
-- PostgREST devuelve "geom" como WKB hexadecimal, incómodo de
-- parsear en el cliente. ST_Y/ST_X lo resuelven en el propio SQL.
-- ============================================================

drop view position_history;

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
  ST_Y(p.geom::geometry) as lat,
  ST_X(p.geom::geometry) as lng,
  p.accuracy_m,
  p.recorded_at
from positions p
join entities e on e.id = p.entity_id
join airsoft_participants ap on ap.entity_id = p.entity_id
left join airsoft_teams t on t.id = ap.team_id
order by p.entity_id, p.recorded_at;
