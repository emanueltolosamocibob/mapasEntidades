-- ============================================================
-- 0021_export_session_roster.sql
-- MAP-29 (replay): el costado del mapa de replay muestra todos los
-- equipos con sus jugadores, no solo el propio — mismo criterio ya
-- decidido para el export a KML (0020): cualquier host o participante
-- aceptado de la sesión puede ver la partida completa al revisarla
-- después, aunque en vivo la visibilidad siga separada por equipo
-- (RF-11). Mismo patrón security definer + chequeo manual de auth.uid()
-- que export_session_positions.
-- ============================================================

create or replace function export_session_roster(p_session_id uuid)
returns table (
  participant_id uuid,
  nickname text,
  role text,
  team_id uuid,
  team_name text,
  team_color text
)
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from sessions
    where id = p_session_id and host_id = auth.uid()
  ) and not exists (
    select 1 from airsoft_participants
    where session_id = p_session_id and user_id = auth.uid() and status = 'accepted'
  ) then
    raise exception 'No tenés acceso a esta sesión';
  end if;

  return query
    select p.id, p.nickname, p.role, p.team_id, t.name, t.color
    from airsoft_participants p
    left join airsoft_teams t on t.id = p.team_id
    where p.session_id = p_session_id and p.status = 'accepted'
    order by t.name, p.nickname;
end;
$$;
