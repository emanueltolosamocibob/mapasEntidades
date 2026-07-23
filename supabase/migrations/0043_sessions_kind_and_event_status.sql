-- ============================================================
-- 0043_sessions_kind_and_event_status.sql
-- MAP-64: tags de estado (ABIERTO/LLENO/EN CURSO/FINALIZADO) en el
-- listado público de eventos.
--
-- list_public_events() (0040) filtraba started_at is null -- una vez
-- que un evento arranca o se cierra, dejaba de listarse, así que
-- EN CURSO/FINALIZADO nunca podían mostrarse. Para ampliar el filtro
-- a todos los estados hace falta poder distinguir un evento de una
-- partida rápida DESPUÉS de que arrancó/cerró (started_at por sí solo
-- ya no alcanza en ese punto, las dos terminan con started_at seteado)
-- -- por eso se agrega sessions.kind, durable, seteado una sola vez al
-- crear y nunca modificado después (adelanta la parte de "tipo
-- persistente" de MAP-67, que además va a sumar winner_team_id más
-- adelante).
--
-- Backfill: solo se puede inferir con certeza para sesiones que
-- todavía no arrancaron (started_at is null) -- ahí sigue siendo
-- events el equivalente a "convocatoria publicada". Sesiones de
-- prueba ya arrancadas/cerradas antes de esta migración quedan como
-- 'quick' (no hay forma retroactiva de saber cuáles eran eventos);
-- de acá en adelante create_session lo setea siempre bien.
-- ============================================================

alter table sessions add column kind text not null default 'quick' check (kind in ('quick', 'event'));

update sessions set kind = 'event' where started_at is null;

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
    origin_lat, origin_lng, movement_radius_m, description, kind
  )
  values (
    v_code, p_name, p_session_type, auth.uid(), v_started_at, v_expires_at,
    p_origin_lat, p_origin_lng, p_movement_radius_m, p_description,
    case when p_start_now then 'quick' else 'event' end
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

-- El return type cambia (columnas nuevas) -- create or replace no permite
-- eso, hay que dropear antes.
drop function if exists list_public_events();

create or replace function list_public_events()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  created_at timestamptz,
  cover_photo_path text,
  started_at timestamptz,
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
    -- null si algún equipo no tiene cupo fijado -- "total" no tiene sentido
    -- mezclando equipos con límite y sin límite en la misma cuenta.
    case
      when exists (select 1 from airsoft_teams t where t.session_id = s.id and t.max_players is null)
        then null
      else (select coalesce(sum(t.max_players), 0)::integer from airsoft_teams t where t.session_id = s.id)
    end as total_capacity
  from sessions s
  where s.session_type = 'airsoft'
    and s.kind = 'event'
    and (
      s.status <> 'closed'
      or (s.status = 'closed' and s.closed_at > now() - interval '14 days')
    )
  order by s.created_at desc;
$$;
