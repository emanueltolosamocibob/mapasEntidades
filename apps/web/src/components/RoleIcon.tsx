// Mismas formas que ROLE_SHAPE_SVG en lib/tacticalIcon.ts (marcadores del
// mapa), reimplementadas como JSX — ese archivo genera HTML crudo para los
// divIcon de Leaflet, no reutilizable directo en un componente React normal.
export const ROLE_LABELS: Record<string, string> = {
  capitan: "Capitán",
  radiooperador: "Radiooperador",
  infanteria: "Infantería",
  sniper: "Sniper",
};

function RoleIcon({ role, className }: { role: string; className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className={className}>
      {role === "capitan" && (
        <rect x="2" y="2" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      )}
      {role === "radiooperador" && (
        <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      )}
      {role === "sniper" && (
        <polygon points="9,1 17,9 9,17 1,9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      )}
      {(role === "infanteria" || !ROLE_LABELS[role]) && (
        <polygon points="9,1 17,16 1,16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default RoleIcon;
