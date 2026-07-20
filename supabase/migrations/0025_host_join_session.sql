-- ============================================================
-- 0025_host_join_session.sql
-- MAP-37: atajo para que el anfitrión se una a su propia partida
-- como jugador, sin pasar por el flujo de solicitud/aceptación
-- (no tiene sentido que se pida permiso a sí mismo) — pero sí tiene
-- que elegir equipo, igual que cualquier jugador.
--
-- Mismo cuerpo que accept_participant (crea entidad + fila ya
-- 'accepted'), pero el propio host es quien inicia la solicitud en
-- vez de aceptar una ajena.
-- ============================================================

create or replace function host_join_session(
  p_session_id uuid,
  p_nickname text,
  p_team_id uuid,
  p_role text default 'infanteria'
) returns airsoft_participants
language plpgsql
security definer
as $$
declare
  v_entity_id uuid;
  v_participant airsoft_participants;
begin
  if not exists (
    select 1 from sessions where id = p_session_id and host_id = auth.uid()
  ) then
    raise exception 'Solo el anfitrión puede usar este atajo';
  end if;

  insert into entities (session_id, entity_type)
  values (p_session_id, 'jugador')
  returning id into v_entity_id;

  insert into airsoft_participants (
    session_id, entity_id, user_id, nickname, team_id, role, status, resolved_at
  )
  values (
    p_session_id, v_entity_id, auth.uid(), p_nickname, p_team_id, p_role, 'accepted', now()
  )
  returning * into v_participant;

  return v_participant;
exception
  when unique_violation then
    raise exception 'Nickname ya en uso en esta sesión, o ya tenés una solicitud vigente';
end;
$$;
