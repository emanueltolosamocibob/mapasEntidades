-- ============================================================
-- 0030_map_markers_rls_policies.sql
-- RLS de map_markers (0029). Mismo patrón de "propio equipo" que
-- entities/positions (ARCHITECTURE.md 8.3): join contra la propia
-- fila de airsoft_participants vía team_id.
--
-- Cualquier jugador del equipo puede insertar y borrar (MAP-57:
-- "sin importar el rol") -- no se restringe a quien lo creó ni al
-- host, a diferencia de otras tablas donde el host modera.
-- ============================================================

create policy "el host ve todos los marcadores de su sesion"
on map_markers for select
using (
  exists (select 1 from sessions s where s.id = map_markers.session_id and s.host_id = auth.uid())
);

create policy "ver marcadores del propio equipo"
on map_markers for select
using (
  exists (
    select 1 from airsoft_participants me
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and me.team_id = map_markers.team_id
  )
);

create policy "agregar marcador al propio equipo"
on map_markers for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1 from airsoft_participants me
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and me.team_id = map_markers.team_id
  )
);

create policy "quitar marcador del propio equipo"
on map_markers for delete
using (
  exists (
    select 1 from airsoft_participants me
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and me.team_id = map_markers.team_id
  )
);
