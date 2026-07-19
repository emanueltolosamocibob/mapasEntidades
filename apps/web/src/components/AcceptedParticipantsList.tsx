import { useModerateParticipant } from "../hooks/useModerateParticipant";
import { Button } from "./ui/button";

type Participant = { id: string; nickname: string; team_id: string | null; role: string };
type Team = { id: string; name: string; color: string | null };

const selectClassName =
  "h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring disabled:opacity-50";

// Los <option> de un <select> nativo no heredan los colores de Tailwind/CSS
// vars del <select> en todos los navegadores — hay que fijarlos a mano.
const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

const ROLE_OPTIONS = [
  { value: "capitan", label: "Capitán" },
  { value: "radiooperador", label: "Radiooperador" },
  { value: "infanteria", label: "Infantería" },
  { value: "sniper", label: "Sniper" },
];

function AcceptedParticipantsList({
  participants,
  teams,
}: {
  participants: Participant[];
  teams: Team[];
}) {
  const { reassignTeam, assignRole, kick, pendingId, error } = useModerateParticipant();

  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay jugadores aceptados.</p>
    );
  }

  const byTeam = teams.map((team) => ({
    team,
    members: participants.filter((p) => p.team_id === team.id),
  }));

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <table className="w-full text-sm">
        {byTeam.map(({ team, members }) => (
          <tbody key={team.id} className="border-b border-border last:border-0">
            <tr>
              <th
                colSpan={4}
                className="pt-3 pb-1.5 text-left text-xs tracking-[0.2em] uppercase"
                style={{ color: team.color ?? undefined }}
              >
                {team.name}{" "}
                <span className="text-muted-foreground normal-case">({members.length})</span>
              </th>
            </tr>
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="pb-3 text-xs text-muted-foreground">
                  Sin jugadores.
                </td>
              </tr>
            )}
            {members.map((participant) => (
              <tr key={participant.id}>
                <td className="py-1.5 pr-2">{participant.nickname}</td>
                <td className="py-1.5 pr-2">
                  <select
                    className={selectClassName}
                    value={participant.team_id ?? ""}
                    disabled={pendingId === participant.id}
                    onChange={(event) => reassignTeam(participant.id, event.target.value)}
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} style={optionStyle}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 pr-2">
                  <select
                    className={selectClassName}
                    value={participant.role}
                    disabled={pendingId === participant.id}
                    onChange={(event) => assignRole(participant.id, event.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value} style={optionStyle}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === participant.id}
                    onClick={() => kick(participant.id)}
                  >
                    Expulsar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default AcceptedParticipantsList;
