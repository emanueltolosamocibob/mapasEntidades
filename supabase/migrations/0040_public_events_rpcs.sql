-- ============================================================
-- 0040_public_events_rpcs.sql
-- Fase 7: acceso público a convocatorias sin aflojar el RLS
-- general de sessions/airsoft_participants (que protege datos de
-- partidas EN VIVO, RF-11). Mismo patrón que
-- export_session_positions (0020): funciones security definer
-- bien acotadas, en vez de una policy de select permisiva.
--
-- Ambas solo devuelven sesiones todavía no iniciadas
-- (started_at is null, status='active') -- apenas el host activa
-- el evento con start_session, se corta este camino público y
-- vuelve a regir la visibilidad normal por equipo.
--
-- list_public_events: listado liviano para el panel/home de
-- "Eventos" -- nombre, portada, descripción. get_session_listing:
-- detalle completo de una convocatoria por código -- descripción,
-- todas las fotos, equipos con cupos y nombres de anotados, y los
-- marcadores de referencia del host (team_id is null, ver 0038).
-- ============================================================

create or replace function list_public_events()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  created_at timestamptz,
  cover_photo_path text
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
    ) as cover_photo_path
  from sessions s
  where s.session_type = 'airsoft'
    and s.started_at is null
    and s.status = 'active'
  order by s.created_at desc;
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
  where code = p_code and status = 'active' and started_at is null;

  if not found then
    raise exception 'Evento no encontrado o ya no está publicado';
  end if;

  select jsonb_build_object(
    'id', v_session.id,
    'code', v_session.code,
    'name', v_session.name,
    'description', v_session.description,
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
