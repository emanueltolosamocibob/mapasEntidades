# Tracking en tiempo real (airsoft → transporte urbano)

Plataforma que muestra en un mapa, en tiempo real, la ubicación de múltiples dispositivos. Caso de uso inicial: partidas de airsoft. Diseñado para extenderse en el futuro a flotas de transporte urbano sin rediseñar el núcleo.

Ver el diseño completo en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): requerimientos, arquitectura en capas, modelo de datos, políticas de seguridad y contrato de API.

## Stack

- Backend: Supabase (Postgres + PostGIS, Auth, Realtime)
- Frontend: React + Leaflet + OpenStreetMap
- Cliente jugador: PWA (Geolocation API)

## Estructura del repo

```
.
├── docs/
│   └── ARCHITECTURE.md      # Documento de diseño completo
├── supabase/
│   └── migrations/          # Esquema de base de datos, en orden de aplicación
│       ├── 0001_core_schema.sql
│       ├── 0002_airsoft_extension.sql
│       ├── 0003_rls_policies.sql
│       └── 0004_rpc_functions.sql
└── apps/
    └── web/                  # Frontend (a implementar)
```

## Setup local

1. Instalar la [Supabase CLI](https://supabase.com/docs/guides/cli).
2. `supabase init` (si no existe `supabase/config.toml` todavía).
3. `supabase start` para levantar el stack local.
4. `supabase db push` para aplicar las migraciones de `supabase/migrations/`.

## Estado del proyecto

En diseño — ver la sección "Roadmap sugerido" en `docs/ARCHITECTURE.md` para las fases planeadas.
