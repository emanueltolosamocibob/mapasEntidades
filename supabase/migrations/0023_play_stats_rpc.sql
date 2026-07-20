-- ============================================================
-- 0023_play_stats_rpc.sql
-- MAP-35: estadísticas de juego del usuario actual para /account.
-- security invoker (no security definer) — cada usuario solo agrega
-- sus propias filas de airsoft_participants/positions, ya cubierto
-- por las RLS existentes, sin necesidad de bypassear nada.
-- ============================================================

create or replace function get_my_play_stats()
returns table (
  matches_played bigint,
  hours_played double precision,
  distance_km double precision
)
language sql
security invoker
stable
as $$
  with my_entities as (
    select entity_id, session_id
    from airsoft_participants
    where user_id = auth.uid() and status = 'accepted' and entity_id is not null
  ),
  ordered_positions as (
    select
      p.entity_id,
      p.recorded_at,
      p.geom,
      lag(p.geom) over (partition by p.entity_id order by p.recorded_at) as prev_geom
    from positions p
    join my_entities me on me.entity_id = p.entity_id
  ),
  per_entity as (
    select
      entity_id,
      max(recorded_at) - min(recorded_at) as duration,
      sum(case when prev_geom is not null then ST_Distance(geom, prev_geom) else 0 end) as distance_m
    from ordered_positions
    group by entity_id
  )
  select
    (select count(distinct session_id) from my_entities)::bigint as matches_played,
    coalesce((select sum(extract(epoch from duration)) from per_entity), 0) / 3600.0 as hours_played,
    coalesce((select sum(distance_m) from per_entity), 0) / 1000.0 as distance_km;
$$;
