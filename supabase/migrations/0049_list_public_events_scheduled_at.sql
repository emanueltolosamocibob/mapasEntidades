-- ============================================================
-- 0049_list_public_events_scheduled_at.sql
-- El listado público de eventos necesita mostrar la fecha/hora de
-- inicio (scheduled_at, agregada en 0048) debajo del título de cada
-- card -- list_public_events() no la traía. El return type cambia
-- (columna nueva), así que hace falta dropear antes de recrear
-- (mismo patrón que 0043).
-- ============================================================

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
