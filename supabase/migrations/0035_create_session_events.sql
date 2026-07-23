-- ============================================================
-- 0035_create_session_events.sql
-- create_session gana p_description y p_start_now (default true,
-- preserva el comportamiento actual de "partida rápida" sin que
-- el frontend existente tenga que cambiar nada -- llama con
-- parámetros nombrados, ver useCreateSession.ts).
--
-- El chequeo de "una sola sesión en curso por host" (0026/0027)
-- ahora solo cuenta sesiones YA INICIADAS (started_at is not
-- null) -- el motivo original era la navegación de vuelta a una
-- partida EN VIVO (MAP-46), eso no aplica a convocatorias todavía
-- no arrancadas. Un host puede tener tantos eventos publicados
-- como quiera en simultáneo, pero solo una partida en vivo.
--
-- drop explícito antes del create or replace: agregar parámetros
-- (aunque tengan default) crea un overload en vez de reemplazar
-- la función -- mismo problema ya resuelto en 0011 y 0024.
-- ============================================================

drop function if exists create_session(text, text, text[], double precision, double precision, integer);

create or replace function create_session(
  p_name text,
  p_session_type text,
  p_team_names text[],
  p_origin_lat double precision default null,
  p_origin_lng double precision default null,
  p_movement_radius_m integer default null,
  p_description text default null,
  p_start_now boolean default true
) returns sessions
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_code text;
  v_team_name text;
  v_started_at timestamptz;
  v_expires_at timestamptz;
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

  foreach v_team_name in array p_team_names loop
    insert into airsoft_teams (session_id, name) values (v_session.id, v_team_name);
  end loop;

  return v_session;
end;
$$;
