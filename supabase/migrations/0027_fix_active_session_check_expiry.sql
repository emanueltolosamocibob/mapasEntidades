-- ============================================================
-- 0027_fix_active_session_check_expiry.sql
-- Fix: el chequeo de "una partida activa por host" (0026) solo
-- miraba status <> 'closed', sin considerar expires_at -- una
-- partida vencida por tiempo pero nunca cerrada a mano seguía
-- bloqueando la creación de una nueva, mientras que el resto de
-- la app (isSessionClosed en el cliente) ya la trata como cerrada.
-- Un host podía quedar bloqueado para siempre sin ninguna partida
-- "en curso" real para volver. Se alinea el chequeo con el mismo
-- criterio que ya usa todo el proyecto (status = 'closed' OR
-- expires_at <= now(), ver lib/sessionStatus.ts).
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
    where host_id = auth.uid() and status <> 'closed' and expires_at > now()
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
