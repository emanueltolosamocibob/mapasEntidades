# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tracking en tiempo real sobre un mapa (Leaflet + OpenStreetMap/CARTO). Caso de uso inicial y único implementado: partidas de airsoft — cada jugador comparte su posición desde el celular, el resto de su equipo lo ve en vivo. El dominio está diseñado a propósito para poder extenderse a otros casos (ej. flotas de transporte urbano) sin tocar el núcleo — ver `docs/ARCHITECTURE.md` para el documento de diseño completo (requerimientos, modelo de datos, políticas de seguridad, contrato de API). Léelo antes de tocar el backend; explica el *por qué* de decisiones que no son obvias mirando solo el esquema (por ejemplo, por qué `airsoft_participants.session_id` está denormalizado).

Frontend deployado como SPA (Vite), backend enteramente en Supabase (Postgres + PostGIS, Auth anónima, Realtime, RPCs). No hay servidor propio.

## Comandos

Todo el trabajo de frontend se hace en `apps/web/`:

```bash
cd apps/web
npm install
npm run dev              # servidor de desarrollo (Vite)
npm run build             # tsc -b (typecheck) + vite build — usar esto para validar tipos, no hay script "typecheck" separado
npm run lint               # oxlint
npx tsc -b --noEmit         # solo typecheck, sin build completo (más rápido para iterar)
```

No hay suite de tests configurada (`test` en el `package.json` raíz es un placeholder que falla a propósito).

Migraciones de base de datos (desde la raíz del repo, la CLI de Supabase está en `node_modules/.bin`, no instalada globalmente):

```bash
npx supabase login                              # una vez por máquina
npx supabase link --project-ref ytmmvqnufgigdhgnvmak   # una vez por máquina
npx supabase migration list                      # ver qué migraciones locales faltan aplicar en remoto
npx supabase db push                              # aplica las migraciones nuevas de supabase/migrations/ al proyecto remoto
```

No hay Supabase local (`supabase start`) en uso — todo el desarrollo apunta directo al proyecto remoto (`apps/web/.env`, no versionado; copiar de `.env.example` y completar con las credenciales del proyecto). No existe un entorno de staging separado: `db push` aplica directo al único proyecto que también usa el frontend en desarrollo.

## Arquitectura de datos: núcleo genérico + extensión por dominio

Las tablas están separadas a propósito en dos capas (ver `docs/ARCHITECTURE.md` §8.1):

- **Núcleo agnóstico al dominio** (no cambia sea cual sea el caso de uso): `sessions`, `entities`, `positions`.
- **Extensión del dominio airsoft**: `airsoft_teams`, `airsoft_participants`.

La pieza no obvia: una solicitud de ingreso pendiente (`airsoft_participants.status = 'pending'`) **todavía no tiene `Entity`** — recién se crea la fila en `entities` cuando el anfitrión acepta (ver la función `accept_participant`). Antes de tocar el flujo de ingreso, conviene tener claro este ciclo: `pending` (sin `entity_id`) → `accepted` (con `entity_id`, vía `accept_participant`) → `kicked`/`rejected`.

Todas las operaciones multi-tabla con reglas de negocio están en funciones RPC de Postgres (`security definer`, cada una valida `auth.uid()` a mano), no en lógica del cliente: `create_session`, `request_join`, `accept_participant`, `reject_participant`, `reassign_team`, `kick_participant`, `close_session`, `leave_session`. Un CRUD directo sobre una sola tabla (mandar una posición, leer el propio estado de participación) se resuelve con el cliente de Supabase llamando a la tabla y confiando en RLS.

**Un mismo `user_id` puede tener múltiples filas históricas** en `airsoft_participants` para la misma sesión (si salió y volvió a pedir ingreso, la fila vieja queda en `kicked`/`rejected` y convive con la nueva `pending`/`accepted` — el índice único parcial solo cubre `status in ('pending','accepted')`). Cualquier query que asuma "una fila por usuario por sesión" con `.maybeSingle()` va a romper con "multiple rows returned" en ese caso; hay que ordenar por `requested_at desc` y tomar la primera.

### Visibilidad por equipo (RF-11)

El filtrado por equipo (un jugador solo ve a su propio equipo) se hace con RLS, no en el cliente — ver `docs/ARCHITECTURE.md` §6.4/§8.3. Al agregar una tabla o columna nueva que exponga posiciones o datos de otros jugadores, la policy correspondiente tiene que replicar el mismo patrón (join contra la propia fila de `airsoft_participants` vía `team_id`).

### Realtime: hay que habilitarlo tabla por tabla

`postgres_changes` **no dispara nada** sobre una tabla hasta que se corre `alter publication supabase_realtime add table X` en una migración — esto ya mordió al proyecto tres veces (`airsoft_participants` en `0007`, `positions` en `0008`, `sessions` en `0014`). Si agregás una suscripción nueva a una tabla que no está en esa lista, no vas a ver ningún error — simplemente el canal nunca emite eventos.

## Frontend (`apps/web/src`)

- `hooks/` — un hook por query/mutación (`useSessionByCode`, `useMyParticipant`, `usePositions`, `useParticipants`, `useTeamRoster`, `useModerateParticipant`, `useCreateSession`, `useJoinSession`, `useCloseSession`, `useLeaveSession`, `useSendPosition`, `useAirsoftTeams`). Los que leen datos que cambian en vivo se suscriben a `postgres_changes` y hacen `refresh()` completo en vez de aplicar el delta a mano.
- `pages/` — `CreateOrJoinPage`, `HostPanelPage`, `PlayPage`. `components/` — todo lo demás, incluida `components/ui/` (primitivos de shadcn).
- `lib/sessionStatus.ts` — `isSessionClosed()`: una sesión está "cerrada" tanto si `status === 'closed'` como si ya pasó `expires_at` (cierre automático a las 5h, RF-16). Los tres puntos de acceso (`PlayPage`, `HostPanelPage`, `request_join`) tienen que tratar ambos casos igual; no hay un cron que marque `closed` activamente, la fuente de verdad es la comparación de fechas en cada punto de acceso (ver `docs/ARCHITECTURE.md` §6.3).
- No hay gestión de estado global (Redux/Zustand/etc.) — todo vive en hooks locales + `SessionContext` (expone el usuario anónimo de Supabase).

## Verificación de cambios de UI

Antes de dar por hecho un cambio visual/de layout, preguntar siempre quién lo va a probar (¿el propio Claude vía el Browser pane, o el usuario a mano en su navegador/celular?) en vez de asumir que Claude debe verificarlo por su cuenta. No asumir tampoco que el Browser pane vaya a funcionar — en esta sesión el proxy de puertos aleatorios de `preview_start` falló repetidamente (páginas quedaban en blanco / "(non-http)").

## Diseño visual (tema táctico/HUD)

Tailwind v4 + shadcn/ui (estilo `"base"`, componentes construidos sobre `@base-ui/react`, no Radix directo). Tema oscuro fijo (sin light mode), acento ámbar, `--radius: 0` (esquinas rectas en todos lados), fuente JetBrains Mono, **todo el texto en mayúsculas** — la regla vive en `index.css` en dos partes porque `button`/`input`/`select`/`textarea` no heredan `text-transform` del `body` por default del navegador; hay una regla explícita aparte para esos elementos.

Componentes reutilizables del tema: `TacticalPanel` (panel con corchetes en las esquinas), `ConfirmDialog` (reemplaza `window.confirm`), `RecenterButton` (botón de "centrar en mi ubicación" compartido entre `MapView` y `OriginPicker`). Los marcadores de Leaflet (origen, "mi ubicación", jugadores) son `divIcon` con SVG inline definidos en `lib/tacticalIcon.ts` — cualquier texto que se interpole ahí (ej. nickname) tiene que pasar por `escapeHtml()`, ya que el `html` de un `divIcon` se inyecta tal cual en el DOM.

Los tiles de mapa son CARTO `dark_all` (gratis, sin API key). El filtro de contraste de los tiles (`.map-tiles-hc` en `index.css`) está ajustable a mano — actualmente en `filter: none`.

### Gotchas de React + Leaflet específicos de este proyecto

- `map.setMinZoom()` / `map.setMaxZoom()` **no disparan ningún evento de Leaflet confiable** (`zoomend` no se dispara con `fitBounds({animate:false})`, y `setMinZoom` no dispara `zoomlevelschange` en este caso, aunque la documentación lo sugiera). Cualquier UI que dependa de saber "el zoom mínimo actual" tiene que resincronizarse en el mismo ciclo de efectos que hizo el `fitBounds` (mismas dependencias de prop, no un listener de evento) — ver `TacticalZoomControl` en `MapView.tsx` para el patrón.
- `fitBounds` sin `animate: false` anima de forma asíncrona; leer `map.getZoom()` inmediatamente después de llamarlo devuelve el valor viejo.
- Antes de un `fitBounds` inicial en un layout donde el contenedor del mapa puede no tener su tamaño final todavía (ej. un panel lateral que se acomoda después del mount), llamar `map.invalidateSize()` primero.
- "Movimiento libre" (sin radio configurado) tiene que quedar realmente libre: no llamar `setMaxBounds`/`setMinZoom` en ese caso. Solo el modo con radio restringido (`FitToRestriction`) debe imponer límites duros de pan/zoom.
