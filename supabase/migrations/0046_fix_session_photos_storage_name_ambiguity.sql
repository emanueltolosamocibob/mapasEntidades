-- ============================================================
-- 0046_fix_session_photos_storage_name_ambiguity.sql
-- Bug en las policies de storage.objects para "session-photos"
-- (0039): storage.foldername(name) usaba `name` sin calificar
-- dentro de un EXISTS contra `sessions s`. Como sessions también
-- tiene columna `name` (el nombre del evento), Postgres resolvía
-- ese `name` como `s.name` en vez de `storage.objects.name` (el
-- path del archivo que se está subiendo/borrando) -- storage.foldername
-- terminaba operando sobre el nombre del evento, nunca sobre el
-- path real, así que el primer segmento nunca coincidía con
-- session_id y el insert/delete fallaba siempre con "new row
-- violates row-level security policy", incluso para el propio host.
-- Fix: calificar explícitamente como storage.objects.name.
-- ============================================================

drop policy "el host sube fotos de su propia sesion" on storage.objects;
drop policy "el host borra fotos de su propia sesion" on storage.objects;

create policy "el host sube fotos de su propia sesion"
on storage.objects for insert
with check (
  bucket_id = 'session-photos'
  and exists (
    select 1 from sessions s
    where s.id::text = (storage.foldername(storage.objects.name))[1]
      and s.host_id = auth.uid()
  )
);

create policy "el host borra fotos de su propia sesion"
on storage.objects for delete
using (
  bucket_id = 'session-photos'
  and exists (
    select 1 from sessions s
    where s.id::text = (storage.foldername(storage.objects.name))[1]
      and s.host_id = auth.uid()
  )
);
