-- ============================================================
-- 0013_leave_session.sql
-- El botón "Salir" del jugador solo navegaba a "/" del lado del
-- cliente: el anfitrión seguía viéndolo como jugador aceptado
-- porque nada cambiaba en airsoft_participants. Este RPC deja que
-- el propio jugador se dé de baja (mismo efecto que kick_participant,
-- pero autorizado por el dueño de la fila en vez del host).
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

  update airsoft_participants
  set status = 'kicked'
  where id = p_participant_id and user_id = auth.uid() and status = 'accepted';

  update entities set lifecycle_status = 'removed' where id = v_entity_id;
end;
$$;
