-- ============================================================
-- 0054_event_join_approval_toggle.sql
-- El host de un evento puede elegir si las solicitudes de ingreso
-- se aceptan automáticamente (comportamiento que ya existía
-- hardcodeado para eventos sin arrancar, ver 0041) o si tiene que
-- aprobarlas a mano, como una partida rápida. Default false (auto)
-- para no cambiar el comportamiento de eventos ya creados/en uso.
--
-- request_join dejaba el auto-accept atado a `started_at is null`
-- -- pasa a depender directamente de `not requires_approval`, sin
-- importar si el evento ya arrancó.
--
-- drop explícito de create_session antes del create or replace:
-- agregar un parámetro nuevo crea un overload en vez de reemplazar
-- la función (bug ya pisado una vez en 0053 -- ver ese archivo).
-- ============================================================

alter table sessions add column requires_approval boolean not null default false;

drop function if exists create_session(
  text, text, text[], double precision, double precision, integer, text, boolean, integer[],
  timestamptz, text, text, text, numeric, numeric, numeric, numeric, boolean
);

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
  p_is_public boolean default true,
  p_requires_approval boolean default false
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
    byop_cost, byop_deposit, rental_cost, rental_deposit, is_public,
    requires_approval
  )
  values (
    v_code, p_name, p_session_type, auth.uid(), v_started_at, v_expires_at,
    p_origin_lat, p_origin_lng, p_movement_radius_m, p_description,
    case when p_start_now then 'quick' else 'event' end,
    p_scheduled_at, p_organizer_name, p_contact_phone, p_address,
    p_byop_cost, p_byop_deposit, p_rental_cost, p_rental_deposit, p_is_public,
    p_requires_approval
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

create or replace function request_join(
  p_code text,
  p_nickname text,
  p_role text default 'infanteria',
  p_team_id uuid default null
) returns airsoft_participants
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_team airsoft_teams;
  v_accepted_count integer;
  v_entity_id uuid;
  v_request airsoft_participants;
begin
  select * into v_session
  from sessions
  where code = p_code and status = 'active'
    and (started_at is null or expires_at > now());

  if not found then
    raise exception 'Sesión no encontrada, cerrada o expirada';
  end if;

  if not v_session.requires_approval and p_team_id is not null then
    select * into v_team from airsoft_teams where id = p_team_id and session_id = v_session.id;
    if not found then
      raise exception 'Ese equipo no pertenece a esta partida';
    end if;

    select count(*) into v_accepted_count
    from airsoft_participants
    where team_id = p_team_id and status = 'accepted';

    if v_team.max_players is not null and v_accepted_count >= v_team.max_players then
      raise exception 'Ese equipo ya no tiene cupo disponible';
    end if;

    insert into entities (session_id, entity_type)
    values (v_session.id, 'jugador')
    returning id into v_entity_id;

    insert into airsoft_participants
      (session_id, user_id, nickname, role, team_id, entity_id, status, resolved_at)
    values
      (v_session.id, auth.uid(), p_nickname, p_role, p_team_id, v_entity_id, 'accepted', now())
    returning * into v_request;

    return v_request;
  end if;

  insert into airsoft_participants (session_id, user_id, nickname, role, status)
  values (v_session.id, auth.uid(), p_nickname, p_role, 'pending')
  returning * into v_request;

  return v_request;
exception
  when unique_violation then
    raise exception 'Nickname ya en uso en esta sesión, o ya tenés una solicitud vigente';
end;
$$;

create or replace function get_session_listing(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_result jsonb;
begin
  select * into v_session
  from sessions
  where code = p_code
    and kind = 'event'
    and (
      status <> 'closed'
      or (status = 'closed' and closed_at > now() - interval '14 days')
    );

  if not found then
    raise exception 'Evento no encontrado o ya no está disponible';
  end if;

  select jsonb_build_object(
    'id', v_session.id,
    'code', v_session.code,
    'name', v_session.name,
    'description', v_session.description,
    'startedAt', v_session.started_at,
    'status', v_session.status,
    'originLat', v_session.origin_lat,
    'originLng', v_session.origin_lng,
    'movementRadiusM', v_session.movement_radius_m,
    'scheduledAt', v_session.scheduled_at,
    'organizerName', v_session.organizer_name,
    'contactPhone', v_session.contact_phone,
    'address', v_session.address,
    'byopCost', v_session.byop_cost,
    'byopDeposit', v_session.byop_deposit,
    'rentalCost', v_session.rental_cost,
    'rentalDeposit', v_session.rental_deposit,
    'requiresApproval', v_session.requires_approval,
    'photos', coalesce((
      select jsonb_agg(
        jsonb_build_object('storagePath', p.storage_path, 'kind', p.kind, 'sortOrder', p.sort_order)
        order by p.sort_order
      )
      from session_photos p
      where p.session_id = v_session.id
    ), '[]'::jsonb),
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'color', t.color,
        'maxPlayers', t.max_players,
        'acceptedCount', (
          select count(*) from airsoft_participants ap
          where ap.team_id = t.id and ap.status = 'accepted'
        ),
        'players', coalesce((
          select jsonb_agg(ap.nickname)
          from airsoft_participants ap
          where ap.team_id = t.id and ap.status = 'accepted'
        ), '[]'::jsonb)
      ))
      from airsoft_teams t
      where t.session_id = v_session.id
    ), '[]'::jsonb),
    'markers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'iconType', m.icon_type, 'label', m.label, 'lat', m.lat, 'lng', m.lng
      ))
      from map_markers m
      where m.session_id = v_session.id and m.team_id is null
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
