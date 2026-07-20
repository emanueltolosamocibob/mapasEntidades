import type { PlayStats } from "../hooks/usePlayStats";

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="border border-border p-3">
      <p className="text-2xl font-bold text-primary tabular-nums">
        {value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 text-xs tracking-[0.15em] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function StatsPanel({ stats }: { stats: PlayStats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile label="Partidas jugadas" value={String(stats.matches_played)} unit="" />
      <StatTile label="Horas jugadas" value={stats.hours_played.toFixed(1)} unit="h" />
      <StatTile label="Distancia caminada" value={stats.distance_km.toFixed(1)} unit="km" />
    </div>
  );
}

export default StatsPanel;
