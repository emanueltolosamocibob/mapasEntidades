-- ============================================================
-- 0053_drop_stale_create_session_overloads.sql
-- Bug preexistente: cada vez que create_session sumó parámetros
-- nuevos (0043, 0048, 0050, 0052), "create or replace function"
-- solo reemplaza si la firma de tipos es idéntica -- al cambiar la
-- lista de parámetros, Postgres creaba un *overload* nuevo en vez de
-- reemplazar el anterior, y las versiones viejas quedaban vivas.
-- PostgREST terminó con 3 candidatos para el mismo nombre y no podía
-- resolver la llamada ("Could not choose the best candidate
-- function"). Se dropean las dos versiones obsoletas (9 y 17
-- parámetros) y queda solo la de 18 (la vigente desde 0052).
-- ============================================================

drop function if exists create_session(
  text, text, text[], double precision, double precision, integer, text, boolean, integer[]
);

drop function if exists create_session(
  text, text, text[], double precision, double precision, integer, text, boolean, integer[],
  timestamptz, text, text, text, numeric, numeric, numeric, numeric
);
