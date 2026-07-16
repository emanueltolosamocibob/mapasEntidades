-- ============================================================
-- 0006_fix_sessions_participants_rls_recursion.sql
-- Fix: recursión cruzada entre las policies de "sessions" y
-- "airsoft_participants" — la policy de sessions consulta
-- airsoft_participants, y la policy "el host ve todas las
-- solicitudes de su sesion" de airsoft_participants consulta
-- sessions, formando un ciclo ("infinite recursion detected in
-- policy for relation sessions"). Mismo patrón que 0005: mover
-- ambos lookups cruzados a funciones security definer, que
-- bypassean RLS al correr con los privilegios del dueño de la
-- tabla y cortan el ciclo.
-- ============================================================

create or replace function is_session_host(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from sessions where id = p_session_id and host_id = auth.uid()
  );
$$;

create or replace function is_accepted_participant(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from airsoft_participants
    where session_id = p_session_id and user_id = auth.uid() and status = 'accepted'
  );
$$;

drop policy "ver mi sesion (host o participante aceptado)" on sessions;

create policy "ver mi sesion (host o participante aceptado)"
on sessions for select
using (
  host_id = auth.uid() or is_accepted_participant(id)
);

drop policy "el host ve todas las solicitudes de su sesion" on airsoft_participants;

create policy "el host ve todas las solicitudes de su sesion"
on airsoft_participants for select
using (is_session_host(session_id));
