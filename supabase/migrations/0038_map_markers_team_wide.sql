-- ============================================================
-- 0038_map_markers_team_wide.sql
-- Fase 7: marcadores "para todos" -- el host los pone al crear el
-- evento (típicamente bases/objetivos de referencia) y los ve
-- cualquier equipo, a diferencia de los marcadores tácticos de
-- MAP-57 que son por equipo. Se modela con team_id nullable: null
-- significa "de toda la sesión", no de un equipo puntual.
--
-- Las policies de equipo de 0030 no cambian (team_id = X sigue
-- funcionando igual); esto solo suma el caso team_id is null,
-- restringido a insert/delete por el host -- son marcadores de
-- referencia curados por el organizador, no algo que cualquier
-- jugador deba poder tocar (a diferencia de los de equipo, donde
-- "sin importar el rol" fue una decisión explícita de MAP-57).
-- ============================================================

alter table map_markers alter column team_id drop not null;

create policy "ver marcadores de toda la sesion"
on map_markers for select
using (
  team_id is null
  and exists (
    select 1 from airsoft_participants me
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and me.session_id = map_markers.session_id
  )
);

create policy "el host agrega marcadores para todos"
on map_markers for insert
with check (
  team_id is null
  and created_by = auth.uid()
  and exists (select 1 from sessions s where s.id = map_markers.session_id and s.host_id = auth.uid())
);

create policy "el host quita marcadores de todos"
on map_markers for delete
using (
  team_id is null
  and exists (select 1 from sessions s where s.id = map_markers.session_id and s.host_id = auth.uid())
);
