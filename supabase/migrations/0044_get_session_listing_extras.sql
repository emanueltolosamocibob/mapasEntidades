-- ============================================================
-- 0044_get_session_listing_extras.sql
-- MAP-65: get_session_listing() necesitaba dos cosas más:
--
-- 1. origin_lat/origin_lng/movement_radius_m -- para poder mostrar el
--    círculo de restricción de movimiento en el mapa de la página de
--    detalle (0040 no los traía, no hacían falta hasta ahora).
--
-- 2. El filtro seguía siendo started_at is null (mismo que tenía
--    list_public_events antes de 0043) -- con el listado ya ampliado
--    a los 4 estados (ABIERTO/LLENO/EN CURSO/FINALIZADO), clickear una
--    card de un evento EN CURSO o FINALIZADO caía en "Evento no
--    encontrado". Se alinea al mismo criterio que list_public_events:
--    kind='event' y (no cerrado, o cerrado hace menos de 14 días).
--
-- No cambia el return type (sigue jsonb) -- create or replace alcanza,
-- sin necesidad de dropear antes.
-- ============================================================

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
