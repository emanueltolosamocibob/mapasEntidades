-- ============================================================
-- 0004_rpc_functions.sql
-- Funciones RPC para operaciones multi-tabla. Ver ARCHITECTURE.md 9.2.
-- security definer: corren con privilegios elevados; cada una valida
-- auth.uid() a mano antes de escribir.
-- ============================================================

create or replace function create_session(
  p_name text,
  p_session_type text,
  p_team_names text[]
) returns sessions
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_code text;
  v_team_name text;
begin
  v_code := upper(substr(md5(random()::text), 1, 6));

  insert into sessions (code, name, session_type, host_id, expires_at)
  values (v_code, p_name, p_session_type, auth.uid(), now() + interval '5 hours')
  returning * into v_session;

  foreach v_team_name in array p_team_names loop
    insert into airsoft_teams (session_id, name) values (v_session.id, v_team_name);
  end loop;

  return v_session;
end;
$$;

create or replace function request_join(
  p_code text,
  p_nickname text
) returns airsoft_participants
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_request airsoft_participants;
begin
  select * into v_session from sessions where code = p_code and status = 'active';
  if not found then
    raise exception 'Sesión no encontrada o cerrada';
  end if;

  insert into airsoft_participants (session_id, user_id, nickname, status)
  values (v_session.id, auth.uid(), p_nickname, 'pending')
  returning * into v_request;

  return v_request;
exception
  when unique_violation then
    raise exception 'Nickname ya en uso en esta sesión, o ya tenés una solicitud vigente';
end;
$$;

create or replace function accept_participant(
  p_request_id uuid,
  p_team_id uuid
) returns airsoft_participants
language plpgsql
security definer
as $$
declare
  v_request airsoft_participants;
  v_entity_id uuid;
begin
  select * into v_request from airsoft_participants where id = p_request_id;

  if not exists (
    select 1 from sessions where id = v_request.session_id and host_id = auth.uid()
  ) then
    raise exception 'Solo el anfitrión puede aceptar solicitudes';
  end if;

  insert into entities (session_id, entity_type)
  values (v_request.session_id, 'jugador')
  returning id into v_entity_id;

  update airsoft_participants
  set entity_id = v_entity_id, team_id = p_team_id, status = 'accepted', resolved_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function reject_participant(p_request_id uuid) returns void
language plpgsql
security definer
as $$
begin
  update airsoft_participants
  set status = 'rejected', resolved_at = now()
  where id = p_request_id
    and exists (
      select 1 from sessions where id = airsoft_participants.session_id and host_id = auth.uid()
    );
end;
$$;

create or replace function reassign_team(
  p_participant_id uuid,
  p_team_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  update airsoft_participants
  set team_id = p_team_id
  where id = p_participant_id
    and status = 'accepted'
    and exists (
      select 1 from sessions where id = airsoft_participants.session_id and host_id = auth.uid()
    );
end;
$$;

create or replace function kick_participant(p_participant_id uuid) returns void
language plpgsql
security definer
as $$
declare
  v_entity_id uuid;
begin
  select entity_id into v_entity_id
  from airsoft_participants
  where id = p_participant_id
    and exists (
      select 1 from sessions where id = airsoft_participants.session_id and host_id = auth.uid()
    );

  update airsoft_participants set status = 'kicked' where id = p_participant_id;
  update entities set lifecycle_status = 'removed' where id = v_entity_id;
end;
$$;

create or replace function close_session(p_session_id uuid) returns void
language plpgsql
security definer
as $$
begin
  update sessions
  set status = 'closed', closed_at = now()
  where id = p_session_id and host_id = auth.uid();
end;
$$;
