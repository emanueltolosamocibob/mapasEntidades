-- ============================================================
-- 0033_map_markers_hold_position.sql
-- Suma "hold_position" (MANTENER POSICIÓN, escudo) al set de
-- icon_type de map_markers. "flag" no cambia de valor en la base --
-- pasa a representar "torre de vigilancia / VIGILAR" solo a nivel de
-- ícono y label en el frontend (tacticalIcon.ts), sin tocar el schema.
-- ============================================================

alter table map_markers drop constraint map_markers_icon_type_check;

alter table map_markers add constraint map_markers_icon_type_check
  check (icon_type in (
    'friendly_base', 'enemy_base', 'objective', 'flag', 'hold_position',
    'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right',
    'arrow_up_left', 'arrow_up_right', 'arrow_down_left', 'arrow_down_right',
    'danger', 'rally_point', 'help'
  ));
