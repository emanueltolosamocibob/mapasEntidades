import { useState } from "react";
import { Link } from "react-router";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import type { PastSession } from "../hooks/usePastSessions";

type KindFilter = "all" | "quick" | "event";

const KIND_LABELS: Record<string, string> = {
  quick: "Partida rápida",
  event: "Evento",
};

function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-3 py-1 text-xs tracking-[0.15em] uppercase transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PastSessionsTable({
  sessions,
  currentUserId,
}: {
  sessions: PastSession[];
  currentUserId: string;
}) {
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no jugaste ninguna partida.</p>;
  }

  const filteredSessions =
    kindFilter === "all" ? sessions : sessions.filter((session) => session.kind === kindFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <FilterOption active={kindFilter === "all"} onClick={() => setKindFilter("all")}>
          Todas
        </FilterOption>
        <FilterOption active={kindFilter === "quick"} onClick={() => setKindFilter("quick")}>
          Partida rápida
        </FilterOption>
        <FilterOption active={kindFilter === "event"} onClick={() => setKindFilter("event")}>
          Evento
        </FilterOption>
      </div>

      {filteredSessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay partidas para este filtro.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-[0.2em] text-muted-foreground uppercase">
                <th className="pb-2">Partida</th>
                <th className="pb-2">Código</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Rol</th>
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Ganador</th>
                <th className="pb-2 text-right">Replay</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-2">{session.name}</td>
                  <td className="py-2 pr-2 text-muted-foreground">{session.code}</td>
                  <td className="py-2 pr-2 text-muted-foreground">
                    {KIND_LABELS[session.kind] ?? session.kind}
                  </td>
                  <td className="py-2 pr-2">
                    {session.host_id === currentUserId ? "Anfitrión" : "Jugador"}
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">
                    {session.kind === "event" ? (session.winner_team_name ?? "—") : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Button size="sm" nativeButton={false} render={<Link to={`/session/${session.code}/replay`} />}>
                      Ver Partida
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PastSessionsTable;
