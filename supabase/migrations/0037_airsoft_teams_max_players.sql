-- ============================================================
-- 0037_airsoft_teams_max_players.sql
-- Cupo por equipo (Fase 7) -- null = sin límite (partidas rápidas
-- no lo usan, quedan siempre sin límite).
-- ============================================================

alter table airsoft_teams add column max_players integer;
alter table airsoft_teams add constraint airsoft_teams_max_players_check
  check (max_players is null or max_players > 0);
