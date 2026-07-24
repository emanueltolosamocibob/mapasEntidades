-- ============================================================
-- 0047_session_photos_sort_order_bigint.sql
-- Bug: session_photos.sort_order se creó como `integer` (0039),
-- pero useSessionPhotoActions.uploadPhoto() siempre guarda
-- Date.now() ahí (milisegundos desde epoch, ~13 dígitos) para
-- mantener el orden de subida. Ese valor excede el rango de
-- integer (máx. 2147483647), así que el insert en session_photos
-- fallaba siempre con "value ... is out of range for type integer"
-- -- ninguna foto llegó nunca a guardarse. bigint soporta
-- Date.now() sin problema.
-- ============================================================

alter table session_photos
  alter column sort_order type bigint,
  alter column sort_order set default 0;
