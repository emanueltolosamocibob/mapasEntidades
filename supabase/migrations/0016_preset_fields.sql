-- ============================================================
-- 0016_preset_fields.sql
-- MAP-21: campos predefinidos (nombre + coordenadas) para elegir
-- como punto de partida al crear una sesión con radio restringido.
-- Sin UI de administración: se cargan a mano por SQL. Lectura
-- pública para cualquier usuario autenticado (dato de referencia,
-- no sensible); sin policies de insert/update/delete porque nadie
-- los edita desde el cliente.
-- ============================================================

create table airsoft_preset_fields (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  lat   double precision not null,
  lng   double precision not null
);

alter table airsoft_preset_fields enable row level security;

create policy "ver campos predefinidos"
on airsoft_preset_fields for select
using (true);
