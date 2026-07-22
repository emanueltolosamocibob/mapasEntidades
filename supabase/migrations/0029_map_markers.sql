-- ============================================================
-- 0029_map_markers.sql
-- Extensión del dominio airsoft: marcadores tácticos en el mapa
-- (MAP-57). Cualquier jugador del equipo, sin importar el rol,
-- puede agregar/quitar -- no requiere entity_id (no es algo
-- rastreado por GPS como un jugador), por eso vive fuera del
-- núcleo (ver ARCHITECTURE.md 8.1).
--
-- lat/lng como float8 en vez de geography(point,4326): a
-- diferencia de "positions", acá no hace falta ST_DWithin ni
-- ninguna otra función de distancia de PostGIS, y evita el
-- problema de WKB hexadecimal que forzó la vista en
-- 0009_latest_positions_lat_lng.sql.
-- ============================================================

create table map_markers (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,      -- denormalizado, mismo motivo que airsoft_participants (ARCHITECTURE.md 8.1)
  team_id     uuid not null references airsoft_teams(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  icon_type   text not null
                check (icon_type in (
                  'friendly_base', 'enemy_base', 'objective', 'flag',
                  'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right',
                  'danger', 'rally_point', 'help'
                )),
  label       text,
  lat         double precision not null,
  lng         double precision not null,
  created_at  timestamptz not null default now()
);

create index map_markers_session_idx on map_markers (session_id);

alter table map_markers enable row level security;
