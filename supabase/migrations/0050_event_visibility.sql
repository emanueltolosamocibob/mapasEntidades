-- ============================================================
-- 0050_event_visibility.sql
-- Eventos públicos vs privados: un evento privado no aparece en
-- list_public_events() (el listado de /eventos), solo es accesible
-- por código directo -- get_session_listing(p_code) ya funciona así
-- para cualquier evento (nunca filtró por visibilidad), así que no
-- hace falta tocarla: "entrar por código" ya es su comportamiento
-- normal, público o privado.
-- ============================================================

alter table sessions add column is_public boolean not null default true;

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

create or replace function list_public_events()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  created_at timestamptz,
  cover_photo_path text,
  started_at timestamptz,
  scheduled_at timestamptz,
  status text,
  has_open_slots boolean,
  accepted_count integer,
  total_capacity integer
)
language sql
security definer
as $$
  select
    s.id,
    s.code,
    s.name,
    s.description,
    s.created_at,
    (
      select p.storage_path from session_photos p
      where p.session_id = s.id and p.kind = 'cover'
      order by p.sort_order
      limit 1
    ) as cover_photo_path,
    s.started_at,
    s.scheduled_at,
    s.status,
    exists (
      select 1 from airsoft_teams t
      where t.session_id = s.id
        and (
          t.max_players is null
          or (
            select count(*) from airsoft_participants ap
            where ap.team_id = t.id and ap.status = 'accepted'
          ) < t.max_players
        )
    ) as has_open_slots,
    (
      select count(*)::integer from airsoft_participants ap
      join airsoft_teams t on t.id = ap.team_id
      where t.session_id = s.id and ap.status = 'accepted'
    ) as accepted_count,
    case
      when exists (select 1 from airsoft_teams t where t.session_id = s.id and t.max_players is null)
        then null
      else (select coalesce(sum(t.max_players), 0)::integer from airsoft_teams t where t.session_id = s.id)
    end as total_capacity
  from sessions s
  where s.session_type = 'airsoft'
    and s.kind = 'event'
    and s.is_public = true
    and (
      s.status <> 'closed'
      or (s.status = 'closed' and s.closed_at > now() - interval '14 days')
    )
  order by s.created_at desc;
$$;
