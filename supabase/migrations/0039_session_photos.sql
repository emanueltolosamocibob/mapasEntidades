-- ============================================================
-- 0039_session_photos.sql
-- Fotos de un evento (Fase 7): una portada + documentos/fotos
-- complementarias. Primer uso de Supabase Storage en este
-- proyecto -- hasta ahora todo era Postgres puro.
--
-- Bucket público ("session-photos"): las fotos de un evento son
-- justamente lo que se muestra en el listado público
-- (list_public_events/get_session_listing, ver
-- 0041_public_events_rpcs.sql), así que no tiene sentido pagar el
-- costo de URLs firmadas -- son de por sí públicas por diseño.
--
-- Convención de path: "{session_id}/{filename}" -- las policies
-- de storage.objects parsean el primer segmento con
-- storage.foldername() para validar que el que sube/borra sea el
-- host de esa sesión.
-- ============================================================

create table session_photos (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  storage_path text not null,
  kind        text not null check (kind in ('cover', 'document')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index session_photos_session_idx on session_photos (session_id);

alter table session_photos enable row level security;

create policy "ver fotos de mi sesion"
on session_photos for select
using (
  exists (
    select 1 from sessions s
    where s.id = session_photos.session_id
      and (
        s.host_id = auth.uid()
        or exists (
          select 1 from airsoft_participants p
          where p.session_id = s.id and p.user_id = auth.uid() and p.status = 'accepted'
        )
      )
  )
);

create policy "el host administra las fotos de su sesion"
on session_photos for all
using (exists (select 1 from sessions s where s.id = session_photos.session_id and s.host_id = auth.uid()))
with check (exists (select 1 from sessions s where s.id = session_photos.session_id and s.host_id = auth.uid()));

insert into storage.buckets (id, name, public)
values ('session-photos', 'session-photos', true)
on conflict (id) do nothing;

create policy "cualquiera puede ver fotos de sesiones (bucket publico)"
on storage.objects for select
using (bucket_id = 'session-photos');

create policy "el host sube fotos de su propia sesion"
on storage.objects for insert
with check (
  bucket_id = 'session-photos'
  and exists (
    select 1 from sessions s
    where s.id::text = (storage.foldername(name))[1]
      and s.host_id = auth.uid()
  )
);

create policy "el host borra fotos de su propia sesion"
on storage.objects for delete
using (
  bucket_id = 'session-photos'
  and exists (
    select 1 from sessions s
    where s.id::text = (storage.foldername(name))[1]
      and s.host_id = auth.uid()
  )
);
