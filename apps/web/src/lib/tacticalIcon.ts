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

// Paths tal cual los usa lucide-react (viewBox 24x24), mismos íconos que
// se ofrecen en MarkerCreateDialog.tsx -- así el marcador en el mapa se ve
// igual al botón que se tocó para crearlo, incluidas las flechas.
const LUCIDE_MARKER_PATHS: Record<MapMarkerIconType, string> = {
  friendly_base:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  enemy_base:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" />',
  objective: '<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />',
  flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />',
  arrow_up: '<path d="m5 12 7-7 7 7" /><path d="M12 19V5" />',
  arrow_down: '<path d="M12 5v14" /><path d="m19 12-7 7-7-7" />',
  arrow_left: '<path d="m12 19-7-7 7-7" /><path d="M19 12H5" />',
  arrow_right: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  danger:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />',
  rally_point:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" />',
  help: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />',
};

// Marcadores tácticos agregados por jugadores (MAP-57) -- label custom si lo
// puso el usuario, o el nombre del tipo por default (ej. "BASE ENEMIGA").
export function mapMarkerIcon(iconType: MapMarkerIconType, label: string | null) {
  const color = MAP_MARKER_COLORS[iconType];
  const text = escapeHtml(label && label.trim() ? label.trim() : MAP_MARKER_LABELS[iconType]);
  const paths = LUCIDE_MARKER_PATHS[iconType];

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:120px;">
        <span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${color};text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">${text}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>
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
