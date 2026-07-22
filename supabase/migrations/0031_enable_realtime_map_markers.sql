-- ============================================================
-- 0031_enable_realtime_map_markers.sql
-- Sin esto, postgres_changes nunca dispara sobre map_markers
-- (mismo gotcha que airsoft_participants/positions/sessions en
-- 0007/0008/0014 -- no da error, simplemente no emite eventos).
-- ============================================================

alter publication supabase_realtime add table map_markers;
