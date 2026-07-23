-- ============================================================
-- 0042_create_session_team_max_players.sql
-- MAP-60: create_session gana p_team_max_players, array paralelo
-- a p_team_names -- permite fijar el cupo de cada equipo (0037)
-- al publicar un evento, en el mismo paso atómico que se crean
-- los equipos, en vez de un update aparte por equipo desde el
-- cliente (que obligaría a re-consultar los ids recién creados y
-- emparejarlos por nombre).
--
-- p_team_max_players default null: si no se pasa (partida rápida,
-- que no cambia), todos los equipos quedan sin límite -- ya es el
-- default de la columna (0037).
--
-- drop explícito antes del create or replace: agregar un
-- parámetro crea un overload en vez de reemplazar la función --
-- mismo problema ya resuelto en 0011/0024/0035/0041.
-- ============================================================

drop function if exists create_session(text, text, text[], double precision, double precision, integer, text, boolean);

create or replace function create_session(
  p_name text,
  p_session_type text,
  p_team_names text[],
  p_origin_lat double precision default null,
  p_origin_lng double precision default null,
  p_movement_radius_m integer default null,
  p_description text default null,
  p_start_now boolean default true,
  p_team_max_players integer[] default null
) returns sessions
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_code text;
  v_started_at timestamptz;
  v_expires_at timestamptz;
  v_i integer;
begin
  if exists (
    select 1 from sessions
    where host_id = auth.uid()
      and started_at is not null
      and status <> 'closed'
      and expires_at > now()
  ) then
    raise exception 'Ya tenés una partida en curso. Cerrala antes de crear una nueva.';
  end if;

  if p_team_max_players is not null and array_length(p_team_max_players, 1) <> array_length(p_team_names, 1) then
    raise exception 'p_team_max_players tiene que tener el mismo largo que p_team_names';
  end if;

  v_code := upper(substr(md5(random()::text), 1, 6));

  if p_start_now then
    v_started_at := now();
    v_expires_at := now() + interval '5 hours';
  else
    v_started_at := null;
    v_expires_at := null;
  end if;

  insert into sessions (
    code, name, session_type, host_id, started_at, expires_at,
    origin_lat, origin_lng, movement_radius_m, description
  )
  values (
    v_code, p_name, p_session_type, auth.uid(), v_started_at, v_expires_at,
    p_origin_lat, p_origin_lng, p_movement_radius_m, p_description
  )
  returning * into v_session;

  for v_i in 1 .. array_length(p_team_names, 1) loop
    insert into airsoft_teams (session_id, name, max_players)
    values (
      v_session.id,
      p_team_names[v_i],
      case when p_team_max_players is not null then p_team_max_players[v_i] else null end
    );
  end loop;

  return v_session;
end;
$$;
