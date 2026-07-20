-- ============================================================
-- 0020_export_session_positions.sql
-- MAP-28: RPC para exportar una partida a KML.
--
-- "position_history" (0017-0019) es security_invoker: un jugador
-- que la consulta directo solo ve las posiciones de su propio
-- equipo (mismas RLS que "positions", RF-11). Pero la decisión de
-- producto para la descarga es que CUALQUIER participante pueda
-- bajar la partida completa (todos los equipos), a diferencia del
-- comportamiento en vivo/replay — es una excepción explícita, no
-- un descuido.
--
-- Por eso esto necesita una función security definer (mismo patrón
-- que el resto de las RPCs de negocio del proyecto, ver
-- accept_participant/create_session): valida a mano que el que
-- llama sea host o participante aceptado de la sesión, y si es así
-- devuelve TODAS las filas de position_history de esa sesión, sin
-- el filtro por equipo que aplicaría la RLS si se consultara la
-- vista directamente.
-- ============================================================

create or replace function export_session_positions(p_session_id uuid)
returns setof position_history
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

  return query select * from position_history where session_id = p_session_id;
end;
$$;
