-- ============================================================
-- 0032_map_markers_diagonal_arrows.sql
-- Suma flechas diagonales (NE/NO/SE/SO) al set de icon_type de
-- map_markers (0029), a pedido de MAP-57 -- el check constraint
-- original solo tenía las 4 cardinales.
-- ============================================================

alter table map_markers drop constraint map_markers_icon_type_check;

alter table map_markers add constraint map_markers_icon_type_check
  check (icon_type in (
    'friendly_base', 'enemy_base', 'objective', 'flag',
    'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right',
    'arrow_up_left', 'arrow_up_right', 'arrow_down_left', 'arrow_down_right',
    'danger', 'rally_point', 'help'
  ));
