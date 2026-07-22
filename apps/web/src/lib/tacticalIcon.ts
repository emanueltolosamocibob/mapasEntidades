import { divIcon } from "leaflet";

const AMBER = "#F5A623";
const GRAY = "#8a8f98";
export const ENEMY_COLOR = "#E5484D"; // mismo tono que --destructive, para equipos enemigos en el replay
const STALE_COLOR = "#E5484D"; // mismo tono que --destructive, para el tag de "hace X" (MAP-51)
const STALE_THRESHOLD_MS = 30_000;

// "45s" / "12m" / "3h" -- sin el prefijo "HACE", se agrega donde se usa.
function formatStaleness(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function originDotIcon() {
  return divIcon({
    html: `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="6" fill="${AMBER}" stroke="#00000066" stroke-width="1" /></svg>`,
    className: "tactical-marker-icon",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function myLocationDotIcon() {
  return divIcon({
    html: `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="5" fill="#ffffff" fill-opacity="0.9" stroke="${AMBER}" stroke-width="2" /></svg>`,
    className: "tactical-marker-icon",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Mismo formato de etiqueta que playerMarkerIcon (nombre arriba del
// ícono), para el punto de "mi ubicación" al elegir el origen de la
// partida — pero marcado como "(TÚ)" en vez de un nickname.
export function myLocationTaggedIcon() {
  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
        <span class="tactical-marker-label" style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${AMBER};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">(TÚ)</span>
        <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="5" fill="#ffffff" fill-opacity="0.9" stroke="${AMBER}" stroke-width="2" /></svg>
      </div>
    `,
    className: "tactical-marker-icon",
    iconSize: [100, 28],
    iconAnchor: [50, 19],
  });
}

const ROLE_SHAPE_SVG: Record<string, (color: string) => string> = {
  capitan: (color) =>
    `<rect x="2" y="2" width="14" height="14" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" />`,
  radiooperador: (color) =>
    `<circle cx="9" cy="9" r="8" fill="none" stroke="${color}" stroke-width="2" />`,
  infanteria: (color) =>
    `<polygon points="9,1 17,16 1,16" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" />`,
  sniper: (color) =>
    `<polygon points="9,1 17,9 9,17 1,9" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" />`,
};

export function distanceLabelIcon(distanceM: number) {
  const label = `${Math.round(distanceM)} M`;

  return divIcon({
    html: `<span class="tactical-marker-label" style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${AMBER};text-shadow:0 1px 2px rgba(0,0,0,0.85),0 0 4px rgba(0,0,0,0.85);white-space:nowrap;">${label}</span>`,
    className: "tactical-marker-icon",
    iconSize: [0, 0],
    iconAnchor: [-6, 6],
  });
}

export type MapMarkerIconType =
  | "friendly_base"
  | "enemy_base"
  | "objective"
  | "flag"
  | "arrow_up"
  | "arrow_down"
  | "arrow_left"
  | "arrow_right"
  | "arrow_up_left"
  | "arrow_up_right"
  | "arrow_down_left"
  | "arrow_down_right"
  | "danger"
  | "rally_point"
  | "help";

// Marcadores de "movimiento" (flechas, incluidas diagonales) vs. de
// "referencia" (el resto) -- MarkerCreateDialog.tsx los agrupa en
// secciones separadas, y los de movimiento nunca llevan tag/label sobre
// el mapa (ver mapMarkerIcon más abajo).
const ARROW_TYPES: ReadonlySet<MapMarkerIconType> = new Set([
  "arrow_up",
  "arrow_down",
  "arrow_left",
  "arrow_right",
  "arrow_up_left",
  "arrow_up_right",
  "arrow_down_left",
  "arrow_down_right",
]);

export function isMovementMarker(iconType: MapMarkerIconType): boolean {
  return ARROW_TYPES.has(iconType);
}

export const MAP_MARKER_LABELS: Record<MapMarkerIconType, string> = {
  friendly_base: "BASE AMIGA",
  enemy_base: "BASE ENEMIGA",
  objective: "OBJETIVO",
  flag: "BANDERA",
  arrow_up: "AVANZAR",
  arrow_down: "RETROCEDER",
  arrow_left: "IZQUIERDA",
  arrow_right: "DERECHA",
  arrow_up_left: "NOROESTE",
  arrow_up_right: "NORESTE",
  arrow_down_left: "SUROESTE",
  arrow_down_right: "SURESTE",
  danger: "PELIGRO",
  rally_point: "PUNTO DE ENCUENTRO",
  help: "AYUDA",
};

export const MAP_MARKER_COLORS: Record<MapMarkerIconType, string> = {
  friendly_base: AMBER,
  enemy_base: ENEMY_COLOR,
  objective: AMBER,
  flag: AMBER,
  arrow_up: AMBER,
  arrow_down: AMBER,
  arrow_left: AMBER,
  arrow_right: AMBER,
  arrow_up_left: AMBER,
  arrow_up_right: AMBER,
  arrow_down_left: AMBER,
  arrow_down_right: AMBER,
  danger: STALE_COLOR,
  rally_point: AMBER,
  help: STALE_COLOR,
};

// Flechas: mismos paths que lucide-react (arrow-up/-down/-left/-right y las
// 4 diagonales), como estaban antes del rediseño de íconos "stencil" --
// las de referencia sí pasan a ser custom rellenas, pero las flechas se
// vuelven a como eran.
const ARROW_PATHS: Record<
  "arrow_up" | "arrow_down" | "arrow_left" | "arrow_right" |
  "arrow_up_left" | "arrow_up_right" | "arrow_down_left" | "arrow_down_right",
  string
> = {
  arrow_up: '<path d="m5 12 7-7 7 7" /><path d="M12 19V5" />',
  arrow_down: '<path d="M12 5v14" /><path d="m19 12-7 7-7-7" />',
  arrow_left: '<path d="m12 19-7-7 7-7" /><path d="M19 12H5" />',
  arrow_right: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  arrow_up_left: '<path d="M7 17V7h10" /><path d="M17 17 7 7" />',
  arrow_up_right: '<path d="M7 7h10v10" /><path d="M7 17 17 7" />',
  arrow_down_left: '<path d="M17 7 7 17" /><path d="M17 17H7V7" />',
  arrow_down_right: '<path d="m7 7 10 10" /><path d="M17 7v10H7" />',
};

function arrowShape(paths: string): { viewBox: string; inner: string } {
  return {
    viewBox: "0 0 24 24",
    inner: `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`,
  };
}

function filledShape(inner: string): { viewBox: string; inner: string } {
  return { viewBox: "0 0 18 18", inner };
}

// Formas compartidas entre el mapa y el picker (MarkerCreateDialog.tsx la
// reusa vía dangerouslySetInnerHTML) -- una sola fuente de verdad, se ven
// idénticas en los dos lugares. Los de "referencia" son custom rellenos,
// bordes rectos, estilo stencil táctico (viewBox 18x18, mismo que
// ROLE_SHAPE_SVG); las flechas quedan como estaban (lucide, viewBox 24x24).
export const MAP_MARKER_SHAPE_SVG: Record<MapMarkerIconType, { viewBox: string; inner: string }> = {
  // Silueta de casa/base, sólida -- amigo/enemigo se diferencian por color
  // (MAP_MARKER_COLORS), no por forma, mismo criterio que el resto del mapa.
  friendly_base: filledShape('<polygon points="9,2 16,8 16,16 2,16 2,8" fill="currentColor" />'),
  enemy_base: filledShape('<polygon points="9,2 16,8 16,16 2,16 2,8" fill="currentColor" />'),
  // Blanco/bullseye: anillo relleno con hueco (evenodd) + punto central.
  objective: filledShape(
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M9 0a9 9 0 100 18A9 9 0 009 0Zm0 4a5 5 0 100 10A5 5 0 009 4Zm0 4a1 1 0 100 2 1 1 0 000-2Z" fill="currentColor" />'
  ),
  flag: filledShape(
    '<rect x="2" y="1" width="2" height="16" fill="currentColor" /><path d="M4 2 L16 5 L4 8 Z" fill="currentColor" />'
  ),
  arrow_up: arrowShape(ARROW_PATHS.arrow_up),
  arrow_down: arrowShape(ARROW_PATHS.arrow_down),
  arrow_left: arrowShape(ARROW_PATHS.arrow_left),
  arrow_right: arrowShape(ARROW_PATHS.arrow_right),
  arrow_up_left: arrowShape(ARROW_PATHS.arrow_up_left),
  arrow_up_right: arrowShape(ARROW_PATHS.arrow_up_right),
  arrow_down_left: arrowShape(ARROW_PATHS.arrow_down_left),
  arrow_down_right: arrowShape(ARROW_PATHS.arrow_down_right),
  danger: filledShape('<polygon points="9,1 17,16 1,16" fill="currentColor" />'),
  rally_point: filledShape('<polygon points="9,1 16,5 16,13 9,17 2,13 2,5" fill="currentColor" />'),
  // Cruz de auxilio -- rellena, bordes rectos, sin curvas (la versión que
  // mejor funcionó visualmente, se restaura tal cual).
  help: filledShape(
    '<rect x="7" y="2" width="4" height="14" fill="currentColor" /><rect x="2" y="7" width="14" height="4" fill="currentColor" />'
  ),
};

// Marcadores tácticos agregados por jugadores (MAP-57) -- label custom si lo
// puso el usuario, o el nombre del tipo por default (ej. "BASE ENEMIGA"). Las
// flechas (movimiento) nunca llevan tag encima -- son puramente direccionales.
export function mapMarkerIcon(iconType: MapMarkerIconType, label: string | null) {
  const color = MAP_MARKER_COLORS[iconType];
  const { viewBox, inner } = MAP_MARKER_SHAPE_SVG[iconType];
  const svg = `<svg class="tactical-marker-glyph" width="18" height="18" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="color:${color}">${inner}</svg>`;

  if (isMovementMarker(iconType)) {
    return divIcon({
      html: svg,
      className: "tactical-marker-icon",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  const text = escapeHtml(label && label.trim() ? label.trim() : MAP_MARKER_LABELS[iconType]);

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:120px;">
        <span class="tactical-marker-label" style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${color};text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">${text}</span>
        ${svg}
      </div>
    `,
    className: "tactical-marker-icon",
    iconSize: [120, 32],
    iconAnchor: [60, 23],
  });
}

export function playerMarkerIcon(
  nickname: string,
  role: string,
  outOfBounds: boolean,
  colorOverride?: string,
  recordedAt?: string
) {
  const color = outOfBounds ? GRAY : (colorOverride ?? AMBER);
  const label = escapeHtml(role === "capitan" ? `${nickname} (CAPITÁN)` : nickname);
  const shape = (ROLE_SHAPE_SVG[role] ?? ROLE_SHAPE_SVG.infanteria)(color);

  // Vacío en replay (no se pasa recordedAt ahí) — la noción de "hace
  // cuánto" solo tiene sentido en vivo, ver MAP-51.
  const staleMs = recordedAt ? Date.now() - new Date(recordedAt).getTime() : 0;
  const isStale = staleMs > STALE_THRESHOLD_MS;
  const staleTag = isStale
    ? `<span class="tactical-marker-label" style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:9px;letter-spacing:0.05em;color:${STALE_COLOR};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">HACE ${formatStaleness(staleMs)}</span>`
    : "";

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
        <span class="tactical-marker-label" style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${color};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">${label}</span>
        ${staleTag}
        <svg class="tactical-marker-glyph" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">${shape}</svg>
      </div>
    `,
    className: "tactical-marker-icon",
    iconSize: [100, isStale ? 44 : 32],
    iconAnchor: [50, isStale ? 35 : 23],
  });
}
