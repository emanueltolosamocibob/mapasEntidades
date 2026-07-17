-- ============================================================
-- 0012_request_join_expiry_check.sql
-- RF-16: una sesión se cierra sola a las 5 horas de creada.
-- request_join solo chequeaba status = 'active', pero nada
-- marca 'closed' automáticamente al vencer expires_at (ver
-- ARCHITECTURE.md 6.3: la fuente de verdad es la comparación de
-- fechas, no un cron). Sin este chequeo, se podía seguir
-- uniendo gente a una sesión vencida indefinidamente.
-- ============================================================

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
  select * into v_session
  from sessions
  where code = p_code and status = 'active' and expires_at > now();

  if not found then
    raise exception 'Sesión no encontrada, cerrada o expirada';
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
