-- ============================================================
-- 0028_fix_leave_session_silent_failure.sql
-- MAP-52: leave_session no fallaba con un error si el UPDATE no
-- encontraba la fila (ej. id equivocado, o ya no estaba 'accepted')
-- -- simplemente no hacía nada, sin avisar. El cliente
-- (useLeaveSession.ts) tampoco chequeaba el error del RPC, así que
-- navegaba como si hubiera salido bien mientras la fila seguía
-- 'accepted' en la base, bloqueando para siempre un reingreso (el
-- índice único "un dispositivo por sesión" cubre status accepted).
-- ============================================================

create or replace function leave_session(p_participant_id uuid) returns void
language plpgsql
security definer
as $$
declare
  v_entity_id uuid;
begin
  select entity_id into v_entity_id
  from airsoft_participants
  where id = p_participant_id and user_id = auth.uid() and status = 'accepted';

  if not found then
    raise exception 'Participante no encontrado o ya no está aceptado en esta partida';
  end if;

  update airsoft_participants
  set status = 'kicked'
  where id = p_participant_id and user_id = auth.uid() and status = 'accepted';

  update entities set lifecycle_status = 'removed' where id = v_entity_id;
end;
$$;
