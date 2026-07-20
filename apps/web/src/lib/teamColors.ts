// Paleta fija y determinística: mismo team_id, mismo color, mientras dure
// la sesión — no se reasigna al azar cada vez que se prende/apaga el
// toggle de "ver todos los equipos" en el panel de anfitrión (MAP-38).
const PALETTE = [
  "#F5A623",
  "#4C9AFF",
  "#36B37E",
  "#FF7452",
  "#998DD9",
  "#00B8D9",
  "#FFAB00",
  "#6554C0",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorForTeam(teamId: string): string {
  return PALETTE[hashString(teamId) % PALETTE.length];
}

export function buildTeamColorMap(teamIds: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of teamIds) map[id] = colorForTeam(id);
  return map;
}
