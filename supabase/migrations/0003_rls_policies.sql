-- ============================================================
-- 0003_rls_policies.sql
-- Row Level Security. Ver ARCHITECTURE.md sección 8.3 para el resumen
-- en tabla y la justificación de cada policy.
-- ============================================================

-- ---------- sessions ----------
create policy "ver mi sesion (host o participante aceptado)"
on sessions for select
using (
  host_id = auth.uid()
  or exists (
    select 1 from airsoft_participants p
    where p.session_id = sessions.id
      and p.user_id = auth.uid()
      and p.status = 'accepted'
  )
);

create policy "crear sesion"
on sessions for insert
with check (host_id = auth.uid());

create policy "cerrar/editar mi sesion (solo host)"
on sessions for update
using (host_id = auth.uid());

-- ---------- airsoft_teams ----------
create policy "ver equipos de mi sesion"
on airsoft_teams for select
using (
  exists (
    select 1 from sessions s
    where s.id = airsoft_teams.session_id
      and (
        s.host_id = auth.uid()
        or exists (
          select 1 from airsoft_participants p
          where p.session_id = s.id and p.user_id = auth.uid() and p.status = 'accepted'
        )
      )
  )
);

create policy "solo el host crea/edita equipos"
on airsoft_teams for all
using (
  exists (select 1 from sessions s where s.id = airsoft_teams.session_id and s.host_id = auth.uid())
);

-- ---------- airsoft_participants ----------
create policy "el host ve todas las solicitudes de su sesion"
on airsoft_participants for select
using (
  exists (select 1 from sessions s where s.id = airsoft_participants.session_id and s.host_id = auth.uid())
);

create policy "un participante ve su propia fila y las de su equipo"
on airsoft_participants for select
using (
  user_id = auth.uid()
  or (
    status = 'accepted'
    and team_id in (
      select team_id from airsoft_participants me
      where me.user_id = auth.uid() and me.status = 'accepted'
    )
  )
);

create policy "solicitar ingreso (propio, pendiente)"
on airsoft_participants for insert
with check (user_id = auth.uid() and status = 'pending');

create policy "el host acepta/rechaza/reasigna/expulsa"
on airsoft_participants for update
using (
  exists (select 1 from sessions s where s.id = airsoft_participants.session_id and s.host_id = auth.uid())
);

-- ---------- entities ----------
create policy "ver entidades segun regla de dominio"
on entities for select
using (
  exists (select 1 from sessions s where s.id = entities.session_id and s.host_id = auth.uid())
  or exists (
    select 1 from airsoft_participants me
    join airsoft_participants owner on owner.team_id = me.team_id
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and owner.status = 'accepted'
      and owner.entity_id = entities.id
  )
);

-- ---------- positions ----------
create policy "el host ve todas las posiciones de su sesion"
on positions for select
using (
  exists (
    select 1 from entities e
    join sessions s on s.id = e.session_id
    where e.id = positions.entity_id and s.host_id = auth.uid()
  )
);

create policy "ver posiciones del propio equipo (airsoft)"
on positions for select
using (
  exists (
    select 1
    from airsoft_participants me
    join airsoft_participants owner on owner.team_id = me.team_id
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and owner.status = 'accepted'
      and owner.entity_id = positions.entity_id
  )
);

create policy "enviar mi propia posicion"
on positions for insert
with check (
  exists (
    select 1 from airsoft_participants p
    where p.entity_id = positions.entity_id
      and p.user_id = auth.uid()
      and p.status = 'accepted'
  )
);

-- Nota: cuando se implemente transporte_urbano, se agregan policies
-- adicionales de "select" sobre entities/positions para ese dominio.
-- Postgres combina policies permisivas con OR, así que conviven sin
-- modificar las de airsoft (ver ARCHITECTURE.md sección 10).
