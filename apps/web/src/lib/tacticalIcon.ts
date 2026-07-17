import { divIcon } from "leaflet";

const RETICLE_SVG = `
<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="14" r="8" fill="none" stroke="#F5A623" stroke-width="2" />
  <circle cx="14" cy="14" r="2" fill="#F5A623" />
  <line x1="14" y1="0" x2="14" y2="5" stroke="#F5A623" stroke-width="2" />
  <line x1="14" y1="23" x2="14" y2="28" stroke="#F5A623" stroke-width="2" />
  <line x1="0" y1="14" x2="5" y2="14" stroke="#F5A623" stroke-width="2" />
  <line x1="23" y1="14" x2="28" y2="14" stroke="#F5A623" stroke-width="2" />
</svg>
`;

export function originMarkerIcon() {
  return divIcon({
    html: RETICLE_SVG,
    className: "tactical-marker-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
