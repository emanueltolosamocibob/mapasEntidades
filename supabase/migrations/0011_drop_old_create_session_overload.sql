-- ============================================================
-- 0011_drop_old_create_session_overload.sql
-- Fix: 0010 agregó una versión de create_session con 3
-- parámetros nuevos con default, pero "create or replace
-- function" con una firma distinta crea una sobrecarga en vez
-- de reemplazar — quedaron dos funciones create_session (la
-- vieja de 3 parámetros y la nueva de 6), y PostgREST no podía
-- decidir cuál usar en una llamada de 3 parámetros
-- ("Could not choose the best candidate function").
-- ============================================================

drop function if exists create_session(text, text, text[]);
