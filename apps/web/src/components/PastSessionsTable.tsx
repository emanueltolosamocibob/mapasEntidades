import { Link } from "react-router";
import { Button } from "./ui/button";
import type { PastSession } from "../hooks/usePastSessions";

function PastSessionsTable({
  sessions,
  currentUserId,
}: {
  sessions: PastSession[];
  currentUserId: string;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no jugaste ninguna partida.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs tracking-[0.2em] text-muted-foreground uppercase">
          <th className="pb-2">Partida</th>
          <th className="pb-2">Código</th>
          <th className="pb-2">Rol</th>
          <th className="pb-2">Fecha</th>
          <th className="pb-2 text-right">Replay</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <tr key={session.id} className="border-b border-border last:border-0">
            <td className="py-2 pr-2">{session.name}</td>
            <td className="py-2 pr-2 text-muted-foreground">{session.code}</td>
            <td className="py-2 pr-2">
              {session.host_id === currentUserId ? "Anfitrión" : "Jugador"}
            </td>
            <td className="py-2 pr-2 text-muted-foreground">
              {new Date(session.created_at).toLocaleDateString()}
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
  );
}

export default PastSessionsTable;
