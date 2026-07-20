// Exportar una partida a KML (MAP-28). Función pura: recibe el
// historial crudo de "position_history" (vía la RPC
// export_session_positions, que devuelve la partida completa sin el
// filtro por equipo que aplicaría la RLS en vivo/replay) y arma el
// XML. Un <Folder> por equipo, un <Placemark><gx:Track> por entidad
// — gx:Track permite animación nativa en Google Earth Pro y
// degrada a línea estática en visores que no lo soportan.
import type { PositionHistoryRow } from "./replayEngine";

const DEFAULT_KML_COLOR = "ff23a6f5"; // aabbggrr, equivalente al ámbar #F5A623 del tema

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hexToKmlColor(hex: string | null): string {
  if (!hex) return DEFAULT_KML_COLOR;
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return DEFAULT_KML_COLOR;
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `ff${b}${g}${r}`.toLowerCase();
}

function styleId(teamId: string | null) {
  return `team-${teamId ?? "sin-equipo"}`;
}

function buildTrackPlacemark(rows: PositionHistoryRow[]) {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const first = sorted[0];
  const whens = sorted
    .map((row) => `      <when>${new Date(row.recorded_at).toISOString()}</when>`)
    .join("\n");
  const coords = sorted
    .map((row) => `      <gx:coord>${row.lng.toFixed(6)} ${row.lat.toFixed(6)} 0</gx:coord>`)
    .join("\n");

  return `    <Placemark>
      <name>${escapeXml(first.nickname)}</name>
      <styleUrl>#${styleId(first.team_id)}</styleUrl>
      <gx:Track>
        <altitudeMode>clampToGround</altitudeMode>
${whens}
${coords}
      </gx:Track>
    </Placemark>`;
}

export function sessionToKml(sessionName: string, rows: PositionHistoryRow[]): string {
  const rowsByEntity = new Map<string, PositionHistoryRow[]>();
  for (const row of rows) {
    const list = rowsByEntity.get(row.entity_id) ?? [];
    list.push(row);
    rowsByEntity.set(row.entity_id, list);
  }

  const teams = new Map<string, { name: string; color: string | null }>();
  for (const row of rows) {
    teams.set(styleId(row.team_id), { name: row.team_name ?? "Sin equipo", color: row.team_color });
  }

  const entitiesByTeam = new Map<string, string[]>();
  for (const [entityId, entityRows] of rowsByEntity) {
    const team = styleId(entityRows[0].team_id);
    const list = entitiesByTeam.get(team) ?? [];
    list.push(entityId);
    entitiesByTeam.set(team, list);
  }

  const styles = [...teams.entries()]
    .map(
      ([id, team]) => `    <Style id="${id}">
      <IconStyle><color>${hexToKmlColor(team.color)}</color><scale>1.1</scale></IconStyle>
      <LineStyle><color>${hexToKmlColor(team.color)}</color><width>3</width></LineStyle>
    </Style>`
    )
    .join("\n");

  const folders = [...entitiesByTeam.entries()]
    .map(([teamStyleId, entityIds]) => {
      const teamName = teams.get(teamStyleId)?.name ?? "Sin equipo";
      const placemarks = entityIds
        .map((entityId) => buildTrackPlacemark(rowsByEntity.get(entityId)!))
        .join("\n");
      return `  <Folder>
    <name>${escapeXml(teamName)}</name>
${placemarks}
  </Folder>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>${escapeXml(sessionName)}</name>
    <open>1</open>
${styles}
${folders}
  </Document>
</kml>
`;
}
