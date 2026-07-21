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
