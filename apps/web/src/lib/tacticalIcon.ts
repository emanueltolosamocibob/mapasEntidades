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
        <span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${AMBER};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">(TÚ)</span>
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
    html: `<span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${AMBER};text-shadow:0 1px 2px rgba(0,0,0,0.85),0 0 4px rgba(0,0,0,0.85);white-space:nowrap;">${label}</span>`,
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
  | "danger"
  | "rally_point"
  | "help";

export const MAP_MARKER_LABELS: Record<MapMarkerIconType, string> = {
  friendly_base: "BASE AMIGA",
  enemy_base: "BASE ENEMIGA",
  objective: "OBJETIVO",
  flag: "BANDERA",
  arrow_up: "AVANZAR",
  arrow_down: "RETROCEDER",
  arrow_left: "IZQUIERDA",
  arrow_right: "DERECHA",
  danger: "PELIGRO",
  rally_point: "PUNTO DE ENCUENTRO",
  help: "AYUDA",
};

const MAP_MARKER_COLORS: Record<MapMarkerIconType, string> = {
  friendly_base: AMBER,
  enemy_base: ENEMY_COLOR,
  objective: AMBER,
  flag: AMBER,
  arrow_up: AMBER,
  arrow_down: AMBER,
  arrow_left: AMBER,
  arrow_right: AMBER,
  danger: STALE_COLOR,
  rally_point: AMBER,
  help: STALE_COLOR,
};

const HOUSE_SHAPE =
  '<path d="M2 9 L9 2 L16 9 M4 8 V16 H14 V8" fill="none" stroke="COLOR" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />';

const MAP_MARKER_SHAPE_SVG: Record<MapMarkerIconType, (color: string) => string> = {
  friendly_base: (color) => HOUSE_SHAPE.replace(/COLOR/g, color),
  enemy_base: (color) => HOUSE_SHAPE.replace(/COLOR/g, color),
  objective: (color) =>
    `<circle cx="9" cy="9" r="7" fill="none" stroke="${color}" stroke-width="2" /><line x1="9" y1="1" x2="9" y2="4" stroke="${color}" stroke-width="2" /><line x1="9" y1="14" x2="9" y2="17" stroke="${color}" stroke-width="2" /><line x1="1" y1="9" x2="4" y2="9" stroke="${color}" stroke-width="2" /><line x1="14" y1="9" x2="17" y2="9" stroke="${color}" stroke-width="2" />`,
  flag: (color) =>
    `<line x1="3" y1="2" x2="3" y2="17" stroke="${color}" stroke-width="2" /><path d="M3 3 L16 6 L3 9 Z" fill="${color}" />`,
  arrow_up: (color) => `<polygon points="9,2 16,16 2,16" fill="${color}" />`,
  arrow_down: (color) => `<polygon points="9,16 16,2 2,2" fill="${color}" />`,
  arrow_left: (color) => `<polygon points="2,9 16,2 16,16" fill="${color}" />`,
  arrow_right: (color) => `<polygon points="16,9 2,2 2,16" fill="${color}" />`,
  danger: (color) =>
    `<polygon points="9,2 17,16 1,16" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" /><line x1="9" y1="7" x2="9" y2="11" stroke="${color}" stroke-width="2" stroke-linecap="round" /><circle cx="9" cy="13.5" r="1" fill="${color}" />`,
  rally_point: (color) =>
    `<circle cx="9" cy="9" r="7" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 2" /><circle cx="9" cy="9" r="2" fill="${color}" />`,
  help: (color) =>
    `<rect x="7" y="2" width="4" height="14" fill="${color}" /><rect x="2" y="7" width="14" height="4" fill="${color}" />`,
};

// Marcadores tácticos agregados por jugadores (MAP-57) -- label custom si lo
// puso el usuario, o el nombre del tipo por default (ej. "BASE ENEMIGA").
export function mapMarkerIcon(iconType: MapMarkerIconType, label: string | null) {
  const color = MAP_MARKER_COLORS[iconType];
  const shape = MAP_MARKER_SHAPE_SVG[iconType](color);
  const text = escapeHtml(label && label.trim() ? label.trim() : MAP_MARKER_LABELS[iconType]);

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:120px;">
        <span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${color};text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">${text}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">${shape}</svg>
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
    ? `<span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:9px;letter-spacing:0.05em;color:${STALE_COLOR};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">HACE ${formatStaleness(staleMs)}</span>`
    : "";

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
        <span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${color};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">${label}</span>
        ${staleTag}
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">${shape}</svg>
      </div>
    `,
    className: "tactical-marker-icon",
    iconSize: [100, isStale ? 44 : 32],
    iconAnchor: [50, isStale ? 35 : 23],
  });
}
