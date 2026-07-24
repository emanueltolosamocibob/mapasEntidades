-- ============================================================
-- 0051_add_medico_dmr_roles.sql
-- Nuevos roles de jugador: médico y DMR. "Sniper" se renombra a
-- "Francotirador" solo como label visible (RoleIcon.tsx/tacticalIcon.ts)
-- -- el valor interno de la columna sigue siendo 'sniper', así no hace
-- falta migrar filas existentes ni tocar la key.
-- ============================================================

alter table airsoft_participants drop constraint airsoft_participants_role_check;
alter table airsoft_participants add constraint airsoft_participants_role_check
  check (role in ('capitan', 'radiooperador', 'infanteria', 'sniper', 'medico', 'dmr'));

alter table users drop constraint users_preferred_role_check;
alter table users add constraint users_preferred_role_check
  check (preferred_role in ('capitan', 'radiooperador', 'infanteria', 'sniper', 'medico', 'dmr'));
