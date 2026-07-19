-- ============================================================
-- 0015_participant_role.sql
-- MAP-22: rol táctico por jugador (capitán / radiooperador /
-- infantería / sniper). Un solo capitán por equipo entre los
-- participantes activos — asignar uno nuevo desplaza al anterior
-- a infantería (ver assign_role).
-- ============================================================

alter table airsoft_participants
  add column role text not null default 'infanteria'
    check (role in ('capitan', 'radiooperador', 'infanteria', 'sniper'));

create unique index airsoft_participants_team_captain_unique
  on airsoft_participants (team_id, role)
  where role = 'capitan' and status = 'accepted';

create or replace function assign_role(
  p_participant_id uuid,
  p_role text
) returns void
language plpgsql
security definer
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id
  from airsoft_participants
  where id = p_participant_id
    and status = 'accepted'
    and exists (
      select 1 from sessions where id = airsoft_participants.session_id and host_id = auth.uid()
    );

  if not found then
    raise exception 'Participante no encontrado o sin permiso';
  end if;

  if p_role = 'capitan' then
    update airsoft_participants
    set role = 'infanteria'
    where team_id = v_team_id
      and role = 'capitan'
      and id <> p_participant_id;
  end if;

  update airsoft_participants
  set role = p_role
  where id = p_participant_id;
end;
$$;
