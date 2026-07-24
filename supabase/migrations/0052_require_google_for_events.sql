-- ============================================================
-- 0052_require_google_for_events.sql
-- Publicar un evento (p_start_now = false) exige haber iniciado
-- sesión con Google -- las partidas rápidas (p_start_now = true)
-- siguen abiertas a usuarios anónimos, sin cambios. El frontend ya
-- bloquea el formulario para anónimos (ver PublishEventPage), esto
-- es la validación server-side (defensa en profundidad, ver
-- ARCHITECTURE.md §8.3 sobre por qué las reglas de negocio viven acá
-- y no solo en el cliente).
-- ============================================================

create or replace function create_session(
  p_name text,
  p_session_type text,
  p_team_names text[],
  p_origin_lat double precision default null,
  p_origin_lng double precision default null,
  p_movement_radius_m integer default null,
  p_description text default null,
  p_start_now boolean default true,
  p_team_max_players integer[] default null,
  p_scheduled_at timestamptz default null,
  p_organizer_name text default null,
  p_contact_phone text default null,
  p_address text default null,
  p_byop_cost numeric default null,
  p_byop_deposit numeric default null,
  p_rental_cost numeric default null,
  p_rental_deposit numeric default null,
  p_is_public boolean default true
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
  if not p_start_now and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Necesitás iniciar sesión con Google para publicar un evento.';
  end if;

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
    origin_lat, origin_lng, movement_radius_m, description, kind,
    scheduled_at, organizer_name, contact_phone, address,
    byop_cost, byop_deposit, rental_cost, rental_deposit, is_public
  )
  values (
    v_code, p_name, p_session_type, auth.uid(), v_started_at, v_expires_at,
    p_origin_lat, p_origin_lng, p_movement_radius_m, p_description,
    case when p_start_now then 'quick' else 'event' end,
    p_scheduled_at, p_organizer_name, p_contact_phone, p_address,
    p_byop_cost, p_byop_deposit, p_rental_cost, p_rental_deposit, p_is_public
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
