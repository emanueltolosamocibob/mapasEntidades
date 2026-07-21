-- ============================================================
-- 0026_restrict_one_active_session_per_host.sql
-- MAP-46: un host no puede tener más de una partida activa a la
-- vez. Sin esto, no había forma de encontrar el camino de vuelta
-- a una partida en curso si se salía del panel de anfitrión, y
-- nada impedía crear varias en paralelo.
-- ============================================================

create or replace function create_session(
  p_name text,
  p_session_type text,
  p_team_names text[],
  p_origin_lat double precision default null,
  p_origin_lng double precision default null,
  p_movement_radius_m integer default null
) returns sessions
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_code text;
  v_team_name text;
begin
  if exists (
    select 1 from sessions
    where host_id = auth.uid() and status <> 'closed'
  ) then
    raise exception 'Ya tenés una partida en curso. Cerrala antes de crear una nueva.';
  end if;

  v_code := upper(substr(md5(random()::text), 1, 6));

  insert into sessions (
    code, name, session_type, host_id, expires_at,
    origin_lat, origin_lng, movement_radius_m
  )
  values (
    v_code, p_name, p_session_type, auth.uid(), now() + interval '5 hours',
    p_origin_lat, p_origin_lng, p_movement_radius_m
  )
  returning * into v_session;

  foreach v_team_name in array p_team_names loop
    insert into airsoft_teams (session_id, name) values (v_session.id, v_team_name);
  end loop;

  return v_session;
end;
$$;
