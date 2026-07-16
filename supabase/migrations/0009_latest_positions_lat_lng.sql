-- ============================================================
-- 0009_latest_positions_lat_lng.sql
-- Ajusta latest_positions (0008) para exponer lat/lng como
-- columnas float8 en vez del geography crudo — PostgREST lo
-- devuelve como WKB hexadecimal, incómodo de parsear en el
-- cliente. ST_Y/ST_X lo resuelven en el propio SQL.
-- ============================================================

drop view latest_positions;

create view latest_positions
with (security_invoker = true)
as
select distinct on (entity_id)
  entity_id,
  ST_Y(geom::geometry) as lat,
  ST_X(geom::geometry) as lng,
  accuracy_m,
  recorded_at
from positions
order by entity_id, recorded_at desc;
