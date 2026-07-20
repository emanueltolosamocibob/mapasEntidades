-- ============================================================
-- 0019_position_history_role.sql
-- Agrega "role" a position_history: el motor de reproducción
-- (MAP-27) necesita devolver el mismo shape que ya consume
-- MapView.tsx desde usePositions (entityId, nickname, role, lat,
-- lng), para que el mapa en modo replay lo reutilice sin cambios.
-- ============================================================

drop view position_history;

create view position_history
with (security_invoker = true)
as
select
  e.session_id,
  p.entity_id,
  ap.nickname,
  ap.role,
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
