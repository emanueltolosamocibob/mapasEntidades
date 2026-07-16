-- ============================================================
-- 0005_fix_participants_rls_recursion.sql
-- Fix: "un participante ve su propia fila y las de su equipo"
-- (0003_rls_policies.sql) referenciaba airsoft_participants dentro
-- de su propia subconsulta, causando "infinite recursion detected
-- in policy for relation airsoft_participants" en cualquier query
-- real a esa tabla. Se mueve la subconsulta a una función
-- security definer: al correr con los privilegios de su dueño
-- (el owner de la tabla), no vuelve a evaluar las policies de
-- airsoft_participants y corta la recursión.
-- ============================================================

create or replace function my_accepted_team_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id
  from airsoft_participants
  where user_id = auth.uid() and status = 'accepted';
$$;

drop policy "un participante ve su propia fila y las de su equipo" on airsoft_participants;

create policy "un participante ve su propia fila y las de su equipo"
on airsoft_participants for select
using (
  user_id = auth.uid()
  or (status = 'accepted' and team_id in (select my_accepted_team_ids()))
);
