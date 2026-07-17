import { divIcon } from "leaflet";

const AMBER = "#F5A623";
const GRAY = "#8a8f98";

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

export function playerMarkerIcon(nickname: string, outOfBounds: boolean) {
  const color = outOfBounds ? GRAY : AMBER;
  const label = escapeHtml(nickname);

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
        <span style="font-family:'JetBrains Mono Variable',ui-monospace,monospace;font-size:10px;letter-spacing:0.05em;color:${color};text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.85);margin-bottom:2px;">${label}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><polygon points="9,1 17,16 1,16" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" /></svg>
      </div>
    `,
    className: "tactical-marker-icon",
    iconSize: [100, 32],
    iconAnchor: [50, 23],
  });
}
