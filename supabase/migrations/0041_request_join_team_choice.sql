-- ============================================================
-- 0041_request_join_team_choice.sql
-- Fase 7: quien se anota a un EVENTO (started_at is null) elige
-- directamente su equipo y, si hay cupo, queda aceptado al toque
-- -- con 1-2 semanas de anticipación, aprobar a mano cada
-- inscripción no escala. En PARTIDA RÁPIDA (started_at ya seteado
-- al crear) el comportamiento no cambia: sigue quedando 'pending'
-- para que el host apruebe a mano, como siempre -- p_team_id
-- simplemente se ignora en ese caso.
--
-- El insert de la fila 'accepted' con su entity_id replica
-- exactamente lo que hace accept_participant (0004): crear la
-- Entity y resolver el participante en el mismo paso.
--
-- drop explícito antes del create or replace: agregar un
-- parámetro nuevo crea un overload en vez de reemplazar la
-- función -- mismo problema ya resuelto en 0011/0024/0035.
-- ============================================================

drop function if exists request_join(text, text, text);

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

  if v_session.started_at is null and p_team_id is not null then
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
