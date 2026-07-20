-- ============================================================
-- 0024_request_join_role.sql
-- El jugador ahora elige su rol preferido al pedir unirse (además
-- del nickname), en vez de arrancar siempre en 'infanteria' fijo.
-- El anfitrión sigue pudiendo reasignarlo después vía assign_role
-- (0015) — esto solo cambia el valor inicial.
--
-- drop explícito antes del create or replace: agregar un parámetro
-- nuevo (aunque tenga default) no reemplaza la función existente,
-- crea un overload aparte — mismo problema que ya se resolvió para
-- create_session en 0011_drop_old_create_session_overload.sql.
-- ============================================================

drop function if exists request_join(text, text);

create or replace function request_join(
  p_code text,
  p_nickname text,
  p_role text default 'infanteria'
) returns airsoft_participants
language plpgsql
security definer
as $$
declare
  v_session sessions;
  v_request airsoft_participants;
begin
  select * into v_session
  from sessions
  where code = p_code and status = 'active' and expires_at > now();

  if not found then
    raise exception 'Sesión no encontrada, cerrada o expirada';
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
