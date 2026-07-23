-- ============================================================
-- 0045_event_winner.sql
-- MAP-67: falta la mitad de "tipo persistente + ganador" -- sessions.kind
-- ya se agregó en 0043 (adelantado ahí para poder ampliar
-- list_public_events a los 4 estados). Acá va lo que quedaba:
--
-- * sessions.winner_team_id -- equipo ganador de un evento, lo marca el
--   host una vez cerrado. No aplica a partida rápida (kind='quick').
-- * set_event_winner(p_session_id, p_team_id) -- solo el host, solo si
--   kind='event' y la sesión ya está cerrada (mismo criterio de
--   isSessionClosed del frontend: status='closed' o expires_at vencido).
--   Decisión de producto: lo marca el host, no hay votación entre
--   jugadores.
-- ============================================================

alter table sessions add column winner_team_id uuid null references airsoft_teams(id);

create or replace function set_event_winner(p_session_id uuid, p_team_id uuid)
returns sessions
language plpgsql
security definer
as $$
declare
  v_session sessions;
begin
  select * into v_session from sessions where id = p_session_id;

  if not found or v_session.host_id <> auth.uid() then
    raise exception 'Solo el anfitrión puede marcar el equipo ganador';
  end if;

  if v_session.kind <> 'event' then
    raise exception 'Solo los eventos tienen equipo ganador';
  end if;

  if not (
    v_session.status = 'closed'
    or (v_session.expires_at is not null and v_session.expires_at <= now())
  ) then
    raise exception 'El evento todavía no terminó';
  end if;

  if not exists (
    select 1 from airsoft_teams where id = p_team_id and session_id = p_session_id
  ) then
    raise exception 'Ese equipo no pertenece a este evento';
  end if;

  update sessions set winner_team_id = p_team_id
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;
