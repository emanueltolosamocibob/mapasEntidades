-- ============================================================
-- 0022_users_profile.sql
-- MAP-32: primera pieza real de la tabla `users` prevista en
-- ARCHITECTURE.md §6.5. Perfil mínimo: nombre para mostrar (se
-- autocompleta con el nombre de Google al crearse, después editable)
-- y rol preferido (mismos valores que airsoft_participants.role).
--
-- El perfil se crea de forma perezosa desde el cliente la primera
-- vez que el usuario visita /account — no hay trigger en el login,
-- para no complicar el flujo de linkIdentity() (MAP-31).
-- ============================================================

create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  preferred_role text not null default 'infanteria'
                   check (preferred_role in ('capitan', 'radiooperador', 'infanteria', 'sniper')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table users enable row level security;

create policy "ver mi propio perfil"
on users for select
using (id = auth.uid());

create policy "crear mi propio perfil"
on users for insert
with check (id = auth.uid());

create policy "editar mi propio perfil"
on users for update
using (id = auth.uid());
