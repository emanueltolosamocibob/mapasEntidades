-- ============================================================
-- 0010_session_origin_and_radius.sql
-- El anfitrión puede fijar, al crear la sesión, un punto de
-- partida y un radio de movimiento permitido (en metros).
-- Ambos nullable: null en movement_radius_m significa
-- "movimiento libre" (sin restricción), que sigue siendo el
-- comportamiento por defecto.
-- ============================================================

alter table sessions
  add column origin_lat double precision,
  add column origin_lng double precision,
  add column movement_radius_m integer
    check (movement_radius_m is null or movement_radius_m > 0);

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
