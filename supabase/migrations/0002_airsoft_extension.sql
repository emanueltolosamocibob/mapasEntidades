-- ============================================================
-- 0002_airsoft_extension.sql
-- Extensión específica del dominio airsoft: equipos y participantes.
-- No la toca nada del núcleo (0001).
-- ============================================================

create table airsoft_teams (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  name        text not null,
  color       text,
  unique (session_id, name)
);

create table airsoft_participants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,  -- denormalizado (ver ARCHITECTURE.md 8.1)
  entity_id     uuid references entities(id) on delete cascade,           -- null mientras está 'pending'
  user_id       uuid not null references auth.users(id),
  nickname      text not null,
  team_id       uuid references airsoft_teams(id),                       -- null mientras está 'pending'
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected', 'kicked')),
  requested_at  timestamptz not null default now(),
  resolved_at   timestamptz
);

-- Nickname único dentro de la sesión, solo entre solicitudes vigentes (RF-13)
create unique index airsoft_participants_nickname_unique
  on airsoft_participants (session_id, nickname)
  where status in ('pending', 'accepted');

-- Un mismo dispositivo no puede tener más de una solicitud/participación vigente
create unique index airsoft_participants_device_unique
  on airsoft_participants (session_id, user_id)
  where status in ('pending', 'accepted');

alter table airsoft_teams enable row level security;
alter table airsoft_participants enable row level security;

-- ------------------------------------------------------------
-- Boceto de la futura extensión de transporte urbano (NO se crea todavía):
--
-- create table transit_lines (
--   id          uuid primary key default gen_random_uuid(),
--   session_id  uuid not null references sessions(id) on delete cascade,
--   name        text not null,
--   color       text
-- );
--
-- create table transit_vehicles (
--   entity_id   uuid primary key references entities(id) on delete cascade,
--   line_id     uuid references transit_lines(id),
--   empresa     text,
--   patente     text
-- );
-- ------------------------------------------------------------
