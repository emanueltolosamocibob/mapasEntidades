# Sistema de tracking en tiempo real — Documento de diseño

## 1. Visión del producto

Plataforma que muestra en un mapa, en tiempo real, la ubicación de múltiples dispositivos que reportan su posición.

**Caso de uso inicial:** partidas de airsoft — cada jugador comparte su posición desde el celular y todos ven un mapa táctico en vivo.

**Caso de uso futuro (no bloqueante para el diseño, pero condiciona la arquitectura):** mapa de una ciudad con la ubicación de los colectivos de una empresa de transporte urbano, alimentados por dispositivos GPS dedicados en cada vehículo.

La decisión de diseño más importante: el "motor de tracking en tiempo real" tiene que ser agnóstico al dominio (no debe saber qué es un "jugador" ni qué es un "colectivo"). Esto se logra con una capa de dominio genérica ("entidades" con posición, agrupadas en "sesiones") y capas específicas de cada caso de uso construidas encima.

**Supuesto de diseño:** se asume que todos los dispositivos tienen conectividad de red en todo momento durante su uso. Esto simplifica el diseño: no se necesita cola offline, ni sincronización diferida, ni resolución de conflictos por reconexión. Si este supuesto deja de cumplirse en el futuro (por ejemplo, GPS de colectivos en zonas sin señal), habría que revisar la capa de ingesta para agregar buffering local — pero no afecta el resto de la arquitectura.

## 2. Requerimientos funcionales (RF)

| ID | Requerimiento |
|----|---------------|
| RF-01 | El sistema debe recibir actualizaciones de posición (latitud, longitud, timestamp) desde dispositivos cliente. |
| RF-02 | El sistema debe emitir esas actualizaciones a todos los clientes suscriptos a la misma sesión, en tiempo real (WebSocket). |
| RF-03 | El sistema debe soportar múltiples "sesiones" simultáneas y aisladas entre sí (ej: dos partidas de airsoft corriendo al mismo tiempo, cada una viendo solo sus propias entidades). |
| RF-04 | Un usuario debe poder crear una sesión (definiendo 2 o más equipos, con nombre por equipo) y unirse a una sesión existente vía código compartido o QR, eligiendo un nickname. El ingreso queda pendiente hasta que el anfitrión lo acepta y le asigna un equipo (ver RF-14). |
| RF-05 | El mapa debe mostrar cada entidad con un marcador que se actualiza en vivo, sin recargar la página. |
| RF-06 | El sistema debe persistir el historial de posiciones de cada entidad, para poder reproducir el recorrido de una partida después de que terminó. |
| RF-07 | El sistema debe soportar al menos dos tipos de fuente de datos de ubicación: apps móviles/PWA (GPS del celular) y dispositivos GPS dedicados (hardware), sin que el dominio necesite cambios para soportar un tercer tipo en el futuro. |
| RF-08 | El sistema debe permitir identificar y diferenciar entidades dentro de una sesión (nombre, equipo/color, tipo de entidad). |
| RF-09 (futuro) | El sistema debe poder mostrar, además de un mapa satelital/de calle genérico, mapas de recintos cerrados (para airsoft en interiores) — esto es un requerimiento a validar, no de la v1. |
| RF-10 (futuro) | El sistema debe poder asociar entidades a una ruta/línea predefinida (para el caso de colectivos urbanos), calculando desvíos respecto de esa ruta. |
| RF-11 | En el dominio de airsoft, un jugador solo debe poder ver en el mapa a las entidades de su propio equipo — nunca al equipo rival. |
| RF-12 (futuro) | El sistema debe permitir iniciar sesión con Google, y asociar el historial de partidas jugadas y sus registros de posición (replay) a esa cuenta. En la v1, la participación es anónima (solo nickname), sin cuenta persistente. |
| RF-13 | El nickname debe ser único dentro de cada sesión (no entre sesiones distintas). Si alguien intenta unirse con un nickname ya tomado en esa sesión, el sistema debe rechazarlo y pedir otro. |
| RF-14 | El jugador no elige su equipo: al pedir unirse a la sesión, su ingreso queda como **solicitud pendiente**; el anfitrión revisa la solicitud, **asigna el equipo** y la acepta (o la rechaza). El equipo, una vez asignado y aceptado, queda fijo — el anfitrión puede reasignarlo después como acción de moderación, pero no hay un flujo de "solicitud de cambio" iniciado por el jugador. |
| RF-15 | El anfitrión (creador de la sesión) tiene un rol de moderador: revisa y decide sobre solicitudes de ingreso (aceptar + asignar equipo, o rechazar), puede reasignar el equipo de un jugador ya admitido, expulsar jugadores, y cerrar la sesión manualmente en cualquier momento. |
| RF-16 | Una sesión se mantiene activa automáticamente hasta que ocurra lo primero de: (a) el anfitrión la cierra manualmente, o (b) pasan 5 horas desde su creación. Pasado ese límite, la sesión se cierra sola. |
| RF-17 (en standby) | Bloqueo por dispositivo de jugadores expulsados — evaluado, pero pospuesto por ahora. Ver preguntas abiertas. |

## 3. Requerimientos no funcionales (RNF)

| ID | Categoría | Requerimiento |
|----|-----------|---------------|
| RNF-01 | Rendimiento / latencia | Las actualizaciones de posición deben propagarse a los demás clientes en menos de 1 segundo. |
| RNF-02 | Escalabilidad | El sistema debe soportar, sin rediseño, al menos 50 entidades activas por sesión (partida de airsoft grande) y una arquitectura que permita escalar a miles si en el futuro se usa para una flota de transporte. |
| RNF-03 | Disponibilidad | Al ser un proyecto personal, no se requiere alta disponibilidad 24/7, pero sí que no se caiga durante una partida en curso (varias horas). |
| RNF-04 | Portabilidad | Debe poder correr en un VPS económico o en contenedores, sin depender de un proveedor cloud específico. |
| RNF-05 | Mantenibilidad | Al ser un desarrollador único, el código debe favorecer simplicidad y convenciones claras por sobre micro-optimizaciones prematuras. |
| RNF-06 | Seguridad | Las sesiones deben protegerse con un código de acceso compartido (también representable como QR) — no cualquiera debe poder unirse o ver una partida ajena. La visibilidad dentro de una sesión debe respetar además la separación por equipo (RF-11): no alcanza con "estar en la sesión", el filtrado debe ser también a nivel de equipo, y preferentemente aplicado en el servidor (no solo ocultado en el cliente). |
| RNF-07 | Extensibilidad | Agregar un nuevo tipo de entidad o fuente de datos no debe requerir modificar la capa de dominio ni la capa de comunicación. |
| RNF-08 | Consumo de batería/datos | El cliente móvil debe poder ajustar la frecuencia de envío de ubicación para no agotar la batería del celular durante una partida larga. |
| RNF-09 | Observabilidad | El sistema debe loguear errores de conexión y de ingesta para poder diagnosticar problemas durante una partida. |

## 4. Arquitectura en capas

```
┌─────────────────────────────────────────────┐
│ 1. Clientes                                  │
│    Mapa web (dashboard) · Apps/PWA jugadores │
├─────────────────────────────────────────────┤
│ 2. Comunicación en tiempo real               │
│    WebSocket gateway · API REST (auth/CRUD)  │
├─────────────────────────────────────────────┤
│ 3. Dominio y aplicación                      │
│    Sesiones · Entidades · Posiciones         │
│    (agnóstico a "jugador" vs "colectivo")    │
├─────────────────────────────────────────────┤
│ 4. Ingesta de dispositivos                   │
│    Adaptador HTTP/WS (celulares)             │
│    Adaptador MQTT (GPS hardware, a futuro)   │
├─────────────────────────────────────────────┤
│ 5. Persistencia                              │
│    PostgreSQL + PostGIS (historial)          │
│    Redis (estado en vivo, pub/sub)           │
└─────────────────────────────────────────────┘
```

### 4.1 Capa de clientes
- **Mapa web (dashboard):** React + una librería de mapas (Leaflet, con OpenStreetMap como capa base — gratis, sin API key). Se conecta por WebSocket para recibir posiciones en vivo.
- **Cliente que envía posición:** en la v1, una PWA (web app instalable) que usa la Geolocation API del navegador. Evita publicar una app nativa en las stores para un proyecto personal, y funciona en Android/iOS por igual.

### 4.2 Capa de comunicación en tiempo real
- **WebSocket gateway:** recibe posiciones entrantes y las redistribuye a los clientes suscriptos a la misma sesión. Recomendado: **Socket.IO** sobre Node.js (maneja reconexión automática y salas/"rooms" nativamente, que mapean muy bien al concepto de "sesión").
- **API REST:** para todo lo que no es tiempo real — crear sesión, unirse, listar entidades, consultar historial. Esto evita mezclar lógica transaccional con el canal de streaming.

### 4.3 Capa de dominio y aplicación
El corazón del diseño. Entidades genéricas:

- **Session** (sesión): contenedor aislado de entidades. Tiene un código de acceso, un tipo (`airsoft`, `transporte_urbano`, ...), y un estado (activa/finalizada).
- **Entity** (entidad): algo que se rastrea dentro de una sesión. Tiene un `tipo` (extensible: `jugador`, `colectivo`), metadata libre (nombre, equipo/color, línea de colectivo), y una posición actual.
- **Position** (posición): lat/lon/timestamp/precisión, asociada a una entidad.
- **PositionSource** (puerto/interfaz): abstracción que desacopla el dominio de cómo llegó el dato (celular vs GPS dedicado). La capa de ingesta implementa esta interfaz; el dominio solo la consume.

Esto es básicamente un patrón de puertos y adaptadores (arquitectura hexagonal) aplicado a una sola pieza: la fuente del dato de posición. Es lo que te permite, el día de mañana, sumar el caso de colectivos sin tocar esta capa — solo agregás un nuevo `PositionSource` y un nuevo tipo de `Entity`.

### 4.4 Capa de ingesta de dispositivos
- **Adaptador HTTP/WS:** recibe la posición que manda la PWA del celular (vía WebSocket, para no reabrir conexión cada pocos segundos).
- **Adaptador MQTT (a futuro):** los dispositivos GPS dedicados (hardware IoT) suelen hablar MQTT en vez de HTTP/WebSocket, porque es el protocolo estándar en ese mundo. Un broker MQTT (ej. Mosquitto o EMQX) recibiría los datos del hardware, y un pequeño servicio "bridge" los traduce al mismo formato interno que usa el dominio. Como se asume conectividad constante (ver supuestos, sección 1), no se necesita lógica de buffering u offline-first en este adaptador — simplifica bastante su implementación.

Esta capa es la que efectivamente cumple RF-07 y RNF-07: agregar una fuente nueva es agregar un adaptador, no modificar el resto del sistema.

### 4.5 Capa de persistencia
- **Redis:** guarda la última posición conocida de cada entidad (para que un cliente que se conecta a mitad de partida vea el estado actual al instante) y funciona como pub/sub interno si en el futuro escalás a más de un proceso de WebSocket.
- **PostgreSQL + PostGIS:** guarda el historial completo de posiciones. PostGIS agrega tipos y funciones geoespaciales nativas (distancias, "¿esta entidad está dentro de esta zona?", cálculo de desvío de ruta) que vas a necesitar tanto para replay de partidas (RF-06) como para el caso de rutas de colectivos (RF-10).

## 5. Stack tecnológico recomendado

| Componente | Elección | Por qué |
|------------|----------|---------|
| Backend runtime | Node.js + TypeScript | Mismo lenguaje en cliente/servidor; excelente soporte para WebSockets; ecosistema maduro para tiempo real |
| Comunicación en tiempo real | Socket.IO | Salas nativas = mapeo directo a "sesiones"; reconexión automática, importante en celulares con señal inestable |
| Framework HTTP | Fastify o Express | REST simple para auth/CRUD, liviano |
| Base de datos | PostgreSQL + extensión PostGIS | Soporte geoespacial de primera clase, sin vendor lock-in |
| Cache / estado en vivo | Redis | Estándar de facto para pub/sub y estado efímero |
| Frontend mapa | React + Leaflet + OpenStreetMap | Sin costo de API, gran soporte de comunidad |
| Cliente jugador | PWA (React + Geolocation API) | Sin publicar en stores; instala como app en el celular |
| Ingesta IoT (futuro) | MQTT (Mosquitto/EMQX) + bridge | Protocolo estándar para dispositivos GPS dedicados |
| Contenedores | Docker + docker-compose | Portabilidad entre tu máquina y cualquier VPS, cumple RNF-04 |

No es la única combinación válida, pero es una que evita atarte a un proveedor cloud específico y que vas a poder correr en un VPS barato (Hetzner, DigitalOcean, etc.) o incluso local con Docker.

## 6. Modelo de sesión, equipos y visibilidad (dominio airsoft)

### 6.1 Flujo v1 (sin cuentas)

1. El **creador** arma una sesión: define nombre de la partida y **2 o más equipos** (nombre + color, ej. "Rojo" / "Azul"). El creador queda automáticamente como **anfitrión/moderador** de esa sesión.
2. El sistema genera un **código de acceso** (corto, tipo "AB3X9") representable también como **QR** que lo codifica.
3. Cada jugador entra con el código/QR y elige un **nickname** (único dentro de esa sesión — si ya está tomado, se rechaza y se pide otro). Esto crea una **solicitud de ingreso pendiente**, no lo admite todavía.
4. El anfitrión ve la lista de solicitudes pendientes, y para cada una decide: **aceptar y asignarle un equipo** (elige él cuál de los equipos definidos), o **rechazar**.
5. Recién al ser aceptado, el jugador queda asociado a: `session_id + team_id + nickname`, y se crea una `Entity` para él dentro de esa sesión. El jugador ve el mapa desde ese momento.
6. El equipo queda fijo tras la aceptación. Si hace falta cambiarlo, es una acción de moderación del anfitrión (RF-14) — no un pedido que inicia el jugador.

### 6.2 Rol de anfitrión / moderador

El creador de la sesión no es "un jugador más" — tiene permisos adicionales sobre el ciclo de vida de la partida y sus participantes:

- Revisar solicitudes de ingreso pendientes: **aceptar + asignar equipo**, o **rechazar** (RF-14).
- Reasignar el equipo de un jugador ya admitido, como acción de moderación directa (sin flujo de solicitud).
- Expulsar a un jugador de la sesión.
- Cerrar la sesión manualmente en cualquier momento (RF-15).

No se contempla un anfitrión "de respaldo": si el anfitrión se desconecta, la sesión sigue viva igual (dado su ciclo de vida por tiempo, ver 6.3), simplemente nadie puede aceptar solicitudes, reasignar equipos ni expulsar hasta que el anfitrión vuelva a conectarse — no se transfiere el rol a otro jugador.

**El bloqueo de un jugador expulsado queda en standby** (ver preguntas abiertas, sección 10) — por ahora, la expulsión saca al jugador de la sesión activa, pero no impide técnicamente que vuelva a solicitar ingreso.

**Nota de identidad:** en vez de inventar un `device_id` propio, conviene usar **Supabase Anonymous Sign-ins**: cada dispositivo obtiene un `user_id` estable (vía `auth.uid()`) sin pedir cuenta, válido para toda la lógica de RLS de esta sección. El día que se active el login con Google (RF-12), ese mismo dispositivo puede "ascender" de anónimo a cuenta permanente con `linkIdentity()`, **conservando el mismo `user_id`** — con lo cual el historial de partidas jugadas como anónimo queda automáticamente asociado a la cuenta, sin migración de datos. Esto es justo el camino de "anónimo ahora, Google después" que se planteó para RF-12.

El código de acceso de la sesión es **fijo durante toda la partida** — no se contempla regenerarlo.

### 6.3 Ciclo de vida de la sesión (RF-16)

Una sesión queda activa desde su creación y se cierra automáticamente por lo primero que ocurra entre:

- El anfitrión la cierra manualmente, o
- Pasan **5 horas** desde la creación.

La forma más simple de implementar el cierre automático sin un proceso corriendo todo el tiempo: guardar `created_at` y calcular `expires_at = created_at + 5h` en el momento de creación, y filtrar por esa fecha en cada consulta ("¿esta sesión sigue vigente?") en vez de depender de un cron que la cierre activamente. Un cron/job periódico puede complementar esto para marcar como `cerrada` las sesiones vencidas y así liberar recursos (por ejemplo, dar de baja canales de Realtime asociados), pero la fuente de verdad de "¿está vigente?" es la comparación de fechas, no el job.

### 6.4 Visibilidad por equipo (RF-11)

El requerimiento clave es que **el filtrado no puede ser solo cosmético en el cliente** — si el dato del equipo rival llega al navegador y solo se lo "esconde" con CSS, cualquiera con las devtools abiertas lo ve igual. El filtrado tiene que pasar por el servidor. Dos formas de lograrlo, no excluyentes:

- **Canales de tiempo real segmentados por equipo:** en vez de un canal único `session:<id>`, se usa `session:<id>:team:<team_id>`. Un cliente solo se suscribe (y el servidor solo autoriza la suscripción) al canal de su propio equipo. El dato del rival nunca viaja hacia esa conexión.
- **Políticas a nivel de base de datos (Row Level Security):** si se persiste cada posición, una política declarativa en Postgres puede exigir que una consulta de posiciones solo devuelva filas donde `team_id` coincide con el equipo del solicitante. Esto es defensa en profundidad además del filtrado por canal.

### 6.5 Camino hacia login con Google e historial (RF-12, futuro)

En v1 el nickname no está atado a ninguna cuenta — es un dato efímero de esa sesión. Cuando se agregue login con Google:

- Se agrega una tabla `users` (poblada por el proveedor de auth), y el `nickname` pasa a ser opcionalmente pre-completado con el nombre de Google, pero sigue siendo editable por partida.
- Se agrega la relación `user_id` (nullable) en la tabla de participantes de sesión — nullable porque siempre debería poder seguir existiendo el modo anónimo para invitados sin cuenta.
- El historial de partidas y el replay (RF-06) se consultan filtrando por `user_id`, mostrando todas las sesiones donde ese usuario participó.

Este orden (anónimo primero, cuenta después) es deliberado: te deja validar el producto sin construir un sistema de auth completo desde el día uno, y cuando lo agregues, no rompe el modo invitado.

## 7. ¿Conviene usar Supabase?

Sí, para este proyecto tiene sentido, y no solo por el precio. Supabase es una capa sobre Postgres que bundlea varias piezas que ya estaban en el diseño:

| Necesidad del proyecto | Qué te da Supabase |
|---|---|
| Base de datos con soporte geoespacial | Postgres gestionado + extensión PostGIS habilitable |
| Canal de tiempo real (capa 2 del diagrama) | Supabase Realtime (Broadcast/Presence), con autorización vía Postgres — reemplaza construir tu propio servidor Socket.IO |
| Visibilidad por equipo (RF-11) | Row Level Security: declarás en la base "esta fila solo la ve quien pertenece a este equipo", en vez de programarlo a mano |
| Login con Google (RF-12, futuro) | Supabase Auth con proveedor Google ya integrado — activar, no construir |
| Historial de partidas y replay | Ya es la misma base Postgres, sin pieza adicional |

**Lo que Supabase no te resuelve:** el adaptador MQTT para los GPS dedicados del caso de transporte urbano (RF-07/RF-10) — eso seguís necesitando armarlo aparte (un broker MQTT + un pequeño puente que escriba a Supabase vía su API). No es un problema, solo hay que tenerlo presente: Supabase cubre las capas 2, 3 (parcialmente, vía RLS) y 5 del diagrama, pero la capa 4 (ingesta) la seguís construyendo vos.

**¿Es gratis?** Sí, tiene plan Free ($0/mes) con:
- 500 MB de base de datos, 50.000 usuarios activos/mes, requests ilimitados
- Realtime: 200 conexiones concurrentes, 2 millones de mensajes/mes
- **Limitación a tener en cuenta:** el proyecto se pausa automáticamente después de 1 semana sin actividad. Para un proyecto personal que se usa cada tantos días (previo a una partida), esto significa acordarte de "despertarlo" con un request antes de jugar, o automatizar un ping periódico (por ejemplo, un cron gratuito en GitHub Actions).

Para tu escala actual (vos como único desarrollador, partidas de hasta ~50 jugadores), el free tier alcanza cómodamente en conexiones y mensajes. Si en algún momento el proyecto crece a uso constante de varias partidas por semana o al caso de transporte urbano con más carga, el plan Pro ($25/mes) es la escala natural — pero no hace falta pensarlo ahora.

**Recomendación:** usar Supabase para las capas 2/3/5, y mantener la capa 4 (ingesta) como un servicio propio y separado (puede ser una función simple que recibe HTTP/MQTT y escribe a Supabase vía su API), tal como estaba planteado en el diagrama original. Esto no compromete la extensibilidad ni te ata a Supabase para la parte que más te interesa mantener bajo tu control.

## 8. Esquema de base de datos (Supabase / Postgres)

### 8.1 Principio de diseño: núcleo genérico + extensión por dominio

Ya habíamos planteado en la sección 4.3 que el dominio debía ser agnóstico (`Entity` genérica, sesiones, `PositionSource`). Para que el SQL respete eso de verdad, separamos:

- **Tablas núcleo** — no cambian nunca, sea cual sea `session_type`: `sessions`, `entities`, `positions`.
- **Tablas de extensión** — una por dominio, con el prefijo del dominio (`airsoft_...`, y a futuro `transit_...`). Ahí vive todo lo que es regla de negocio específica: equipos, nicknames, el flujo de aprobación de ingreso.

La pieza sutil: **una solicitud de ingreso pendiente todavía no es una `Entity`**. Mientras el anfitrión no la acepta, no hay nada que rastrear en el mapa — por lo tanto no existe fila en `entities` todavía. Recién al aceptar la solicitud se crea la `Entity` genérica y se la vincula a la fila de extensión (`airsoft_participants`). Esto evita que el núcleo tenga que saber qué es un "nickname" o un "equipo".

```sql
create extension if not exists postgis;

-- ============ NÚCLEO (agnóstico al dominio) ============

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

-- ============ EXTENSIÓN: dominio airsoft ============

create table airsoft_teams (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  name        text not null,
  color       text,
  unique (session_id, name)
);

create table airsoft_participants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,  -- denormalizado, ver nota
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
```

**Nota sobre `airsoft_participants.session_id` denormalizado:** en Postgres, un índice único parcial solo puede referenciar columnas de su propia tabla. Como el `status='pending'` vive antes de que exista una `Entity` (y por lo tanto antes de tener `entity_id`), no se puede llegar a `session_id` a través de un join a `entities`. Se denormaliza `session_id` en `airsoft_participants` (se copia al crear la fila, y no cambia) puramente para que el índice de unicidad funcione sin joins. Es un trade-off consciente: un poco de duplicación de datos a cambio de una constraint de integridad simple y eficiente.

**Flujo de aceptación (lo que ejecuta el anfitrión al aprobar una solicitud):**

```sql
-- 1. Se crea la Entity genérica
insert into entities (session_id, entity_type)
values (:session_id, 'jugador')
returning id;  -- → :new_entity_id

-- 2. Se vincula la solicitud aceptada a esa Entity, y se fija el equipo asignado
update airsoft_participants
set entity_id = :new_entity_id,
    team_id   = :assigned_team_id,
    status    = 'accepted',
    resolved_at = now()
where id = :participant_request_id;
```

Esto conviene envolverlo en una función de Postgres (`accept_participant(request_id, team_id)`) para que sea una operación atómica, en vez de dos statements sueltos desde el cliente.

### 8.2 Cómo se vería la extensión para transporte urbano (boceto, no se crea todavía)

Esto es solo para mostrar que el núcleo no necesita tocarse — no hace falta implementarlo ahora:

```sql
create table transit_lines (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  name        text not null,      -- ej. "Línea 102"
  color       text
);

create table transit_vehicles (
  entity_id   uuid primary key references entities(id) on delete cascade,
  line_id     uuid references transit_lines(id),
  empresa     text,
  patente     text
);
```

Notar lo que **no** cambia: `sessions`, `entities`, `positions` quedan intactas. No hay concepto de "solicitud pendiente" para un colectivo — un administrador da de alta el vehículo directamente, creando la `Entity` y la fila de extensión en el mismo paso (sin el estado `pending` que sí necesita airsoft).

### 8.3 Políticas de Row Level Security (resumen)

| Tabla | Quién puede leer | Quién puede escribir |
|---|---|---|
| `sessions` | El anfitrión, o cualquier participante `accepted` de esa sesión | Insert: cualquier usuario autenticado. Update (cerrar): solo `host_id = auth.uid()` |
| `entities` / `positions` | Depende del dominio — ver policy de ejemplo abajo | Insert en `positions`: solo el dueño de la `Entity` (resuelto vía la tabla de extensión correspondiente) |
| `airsoft_teams` | Participantes de la sesión | Solo el anfitrión |
| `airsoft_participants` | El anfitrión ve todas las de su sesión. Un participante ve su propia fila + las `accepted` de su mismo `team_id` | Insert (solicitar ingreso): el propio usuario, `status='pending'`. Update (aceptar/rechazar/reasignar/expulsar): solo el anfitrión |

La policy que resuelve RF-11 (visibilidad por equipo) ahora atraviesa la tabla de extensión, porque el `team_id` vive ahí y no en `positions`:

```sql
create policy "ver posiciones del propio equipo (airsoft)"
on positions for select
using (
  exists (
    select 1
    from airsoft_participants me
    join airsoft_participants owner on owner.team_id = me.team_id
    where me.user_id = auth.uid()
      and me.status = 'accepted'
      and owner.status = 'accepted'
      and owner.entity_id = positions.entity_id
  )
);
```

**Esto es lo que gana la extensibilidad real:** cuando se implemente transporte urbano, esta policy de airsoft no se toca — se agrega una *segunda* policy de `select` sobre `positions` para el caso de colectivos (por ejemplo, visibilidad pública o por empresa). Postgres combina policies permisivas con `OR`, así que ambas conviven sin interferirse: una entidad de tipo `jugador` nunca hace match contra la policy de colectivos, y viceversa.



## 9. API y contrato de comunicación en tiempo real

Con Supabase, "la API" es en gran parte auto-generada (PostgREST) sobre las tablas ya definidas, más un puñado de **funciones RPC** para las operaciones que tienen reglas de negocio (no son un CRUD simple), y **suscripciones Realtime** para todo lo que el cliente necesita recibir en vivo.

### 9.1 Identidad

Antes de cualquier otra llamada, el cliente asegura una sesión de auth:

```js
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  await supabase.auth.signInAnonymously();
}
```

Esto le da a cada dispositivo un `auth.uid()` estable, usado en todas las policies de la sección 8.3.

### 9.2 Funciones RPC (operaciones con reglas de negocio)

Se implementan como funciones de Postgres (`security definer`, con el chequeo de autorización escrito a mano adentro) porque cada una toca más de una tabla en un solo paso atómico — algo que una policy de RLS por sí sola no puede expresar.

| Función | Quién la llama | Qué hace |
|---|---|---|
| `create_session(name, session_type, team_names[])` | Cualquier usuario autenticado | Crea `sessions` (genera `code`, `expires_at = now() + 5h`, `host_id = auth.uid()`) y una fila en `airsoft_teams` por cada nombre recibido. Devuelve la sesión creada. |
| `request_join(code, nickname)` | Cualquier usuario autenticado | Busca la sesión por `code` (debe estar `active`), inserta en `airsoft_participants` con `status='pending'`. Falla si el nickname ya está tomado en esa sesión (RF-13) o si ya hay una solicitud vigente de ese `user_id` (RF: una solicitud a la vez). |
| `accept_participant(request_id, team_id)` | Solo el `host_id` de la sesión | El flujo de la sección 8.1: crea la `Entity`, vincula `airsoft_participants.entity_id`, fija `team_id`, pasa `status='accepted'`. |
| `reject_participant(request_id)` | Solo el host | `status='rejected'`, sin crear `Entity`. |
| `reassign_team(participant_id, team_id)` | Solo el host | Cambia el `team_id` de un participante ya aceptado (acción directa de moderación, sin flujo de solicitud — RF-14). |
| `kick_participant(participant_id)` | Solo el host | `airsoft_participants.status='kicked'` + `entities.lifecycle_status='removed'`. |
| `close_session(session_id)` | Solo el host | `sessions.status='closed'`, `closed_at=now()`. |

Cada función chequea `auth.uid()` contra `host_id` (o contra el dueño del recurso, según corresponda) antes de escribir — es la autorización explícita que reemplaza a la RLS en estos casos, ya que la función corre con privilegios elevados para poder tocar varias tablas a la vez.

### 9.3 Operaciones directas (sin RPC, RLS resuelve solo)

No todo necesita una función — lo que es un CRUD directo sobre una sola tabla se resuelve con el cliente de Supabase llamando a la tabla, confiando en que la policy de la sección 8.3 ya lo autoriza o lo bloquea:

```js
// Enviar posición (el propio jugador, dueño de la Entity)
await supabase.from('positions').insert({
  entity_id: myEntityId,
  geom: `SRID=4326;POINT(${lon} ${lat})`,
  accuracy_m: accuracy,
});

// Consultar mi propio estado de participación (para saber si ya me aceptaron y en qué equipo quedé)
await supabase
  .from('airsoft_participants')
  .select('status, team_id, entity_id')
  .eq('user_id', myUserId)
  .eq('session_id', sessionId)
  .maybeSingle();
```

### 9.4 Suscripciones Realtime

| Canal (tabla + filtro) | Evento | Quién lo escucha | Qué recibe (gracias a RLS) |
|---|---|---|---|
| `postgres_changes` sobre `airsoft_participants`, filtro `session_id=eq.<id>` | `INSERT`, `UPDATE` | El anfitrión | Todas las solicitudes nuevas (para su bandeja de aprobación) y cambios de estado de cualquier participante de su sesión |
| `postgres_changes` sobre `airsoft_participants`, filtro `user_id=eq.<mi_id>` | `UPDATE` | Cada jugador, sobre su propia fila | Se entera en vivo cuando el anfitrión lo acepta/rechaza/reasigna de equipo |
| `postgres_changes` sobre `positions` (sin filtro adicional — RLS hace el trabajo) | `INSERT` | Cualquier jugador aceptado | Solo las posiciones de entidades de su propio equipo (RF-11), por la policy de 8.3 |
| `postgres_changes` sobre `sessions`, filtro `id=eq.<session_id>` | `UPDATE` | Todos los clientes conectados a esa sesión | Se enteran si el anfitrión cerró la sesión, o si expiró |

El punto notable de la fila de `positions`: no hace falta armar un canal separado por equipo — es la misma suscripción para todos, y cada cliente recibe únicamente las filas que su propia policy de RLS le permite ver. Es la misma garantía de la sección 8.3 (el filtrado ocurre en la base de datos, no en el cliente) aplicada también al canal en tiempo real.

### 9.5 Flujo end-to-end resumido

**Anfitrión:** `create_session` → queda escuchando `airsoft_participants` filtrado por su sesión → por cada solicitud entrante, `accept_participant` o `reject_participant` → opcionalmente `reassign_team` / `kick_participant` durante la partida → `close_session` al terminar.

**Jugador:** `signInAnonymously` (si no lo hizo antes) → `request_join(code, nickname)` → espera escuchando su propia fila de `airsoft_participants` → al recibir `status='accepted'`, ya tiene su `entity_id` y `team_id` → empieza a hacer `insert` en `positions` a intervalos regulares, y se suscribe a `positions` para ver al resto de su equipo en el mapa.

## 10. Estrategia de extensibilidad hacia el caso de transporte urbano

No se diseña una segunda arquitectura para esto — se aprovecha el núcleo genérico definido en la sección 8 (`sessions`, `entities`, `positions`). En concreto, se agregaría:

1. Un nuevo valor de `session_type`: `transporte_urbano`.
2. Las tablas de extensión `transit_lines` y `transit_vehicles` (ver boceto en 8.2), análogas a `airsoft_teams`/`airsoft_participants` pero sin flujo de aprobación — un administrador da de alta el vehículo y su `Entity` en el mismo paso.
3. Un nuevo `PositionSource` en la capa de ingesta (sección 4.4): el adaptador MQTT que recibe datos del hardware GPS y escribe directamente en `positions`, usando el `entity_id` del vehículo correspondiente.
4. Opcionalmente, el concepto de `Route` (ruta predefinida) y lógica para calcular desvío (RF-10) — una pieza de dominio nueva, pero acotada a las tablas de extensión de transporte urbano.
5. Una nueva policy de RLS sobre `positions` para este dominio (visibilidad pública o por empresa), que convive con la de airsoft sin modificarla (ver 8.3).

Todo lo demás — WebSocket/Realtime, mapa, `sessions`/`entities`/`positions` — se reutiliza sin cambios.

## 11. Roadmap sugerido

1. **Fase 1 — MVP airsoft:** creación de sesión con equipos, solicitud de ingreso por código/QR con nickname único, aprobación + asignación de equipo por el anfitrión, Session + Entity + Position, visibilidad filtrada por equipo (RF-11) vía RLS de Supabase, rol de anfitrión/moderador (aceptar/rechazar ingresos, reasignar equipo, expulsar, cerrar sesión), cierre automático a las 5 horas (RF-16), mapa en vivo, sin historial.
2. **Fase 2 — Historial y replay:** persistencia de posiciones en Postgres/PostGIS, endpoint para reproducir una partida.
3. **Fase 3 — Cuentas:** login con Google (RF-12), asociación de historial de partidas a la cuenta, manteniendo el modo anónimo para invitados.
4. **Fase 4 — Robustez:** ajuste de frecuencia de envío (RNF-08), observabilidad (RNF-09).
5. **Fase 5 — Extensión a transporte urbano:** nuevo tipo de entidad, adaptador MQTT, concepto de rutas.

## 12. Preguntas abiertas (a resolver antes de codear)

- **(En standby)** Bloqueo de expulsados: con Anonymous Sign-ins, el `user_id` ya es más estable que un simple valor en `localStorage` (persiste en la sesión del navegador), pero igual se pierde si el usuario borra datos del navegador o cambia de dispositivo. ¿Vale la pena resolverlo ahora con lo que da Supabase, o esperar al login con Google para una identidad más fuerte? Por ahora no se implementa.
- ¿Un jugador expulsado se entera de que fue expulsado (mensaje explícito), o simplemente ve que ya no está en la sesión?
- Mientras el anfitrión no revisa una solicitud de ingreso, ¿el jugador ve algún estado de "esperando aprobación", o directamente no accede a nada de la interfaz hasta ser aceptado?
