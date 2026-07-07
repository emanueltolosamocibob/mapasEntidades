-- ============================================================
-- 0001_core_schema.sql
-- Núcleo agnóstico al dominio: sessions, entities, positions.
-- No cambia sea cual sea session_type (airsoft, transporte_urbano, ...).
-- ============================================================

create extension if not exists postgis;
create extension if not exists pgcrypto; -- para gen_random_uuid()

create table sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  session_type  text not null default 'airsoft'
                  check (session_type in ('airsoft', 'transporte_urbano')),
  host_id       uuid not null references auth.users(id),
  status        text not null default 'active'
                  check (status in ('active', 'closed')),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  closed_at     timestamptz
);

create table entities (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references sessions(id) on delete cascade,
  entity_type      text not null,              -- 'jugador' | 'colectivo' | ...
  lifecycle_status text not null default 'active'
                     check (lifecycle_status in ('active', 'removed')),
  created_at       timestamptz not null default now()
);

create table positions (
  id            bigint generated always as identity primary key,
  entity_id     uuid not null references entities(id) on delete cascade,
  geom          geography(point, 4326) not null,
  accuracy_m    real,
  recorded_at   timestamptz not null default now()
);

create index positions_entity_recorded_idx
  on positions (entity_id, recorded_at desc);

-- Habilitar RLS (las policies concretas viven en 0003_rls_policies.sql)
alter table sessions enable row level security;
alter table entities enable row level security;
alter table positions enable row level security;
