-- ============================================================
-- 0036_start_session_rpc.sql
-- "Iniciar partida": el host activa un evento publicado el día
-- que se juega de verdad. Recién acá arranca la ventana de 5h de
-- RF-16 -- hasta este punto la convocatoria no vence nunca.
-- ============================================================

create or replace function start_session(p_session_id uuid)
returns sessions
language plpgsql
security definer
as $$
declare
  v_session sessions;
begin
  select * into v_session from sessions where id = p_session_id;

  if not found or v_session.host_id <> auth.uid() then
    raise exception 'Solo el anfitrión puede iniciar esta partida';
  end if;

  if v_session.status = 'closed' then
    raise exception 'Esta partida ya está cerrada';
  end if;

  if v_session.started_at is not null then
    raise exception 'Esta partida ya está iniciada';
  end if;

  update sessions
  set started_at = now(), expires_at = now() + interval '5 hours'
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;
