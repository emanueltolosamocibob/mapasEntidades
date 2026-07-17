import { useModerateParticipant } from "../hooks/useModerateParticipant";
import { Button } from "./ui/button";

type Participant = { id: string; nickname: string; team_id: string | null };
type Team = { id: string; name: string };

function AcceptedParticipantsList({
  participants,
  teams,
}: {
  participants: Participant[];
  teams: Team[];
}) {
  const { reassignTeam, kick, pendingId, error } = useModerateParticipant();

  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay jugadores aceptados.</p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="space-y-3">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="flex flex-wrap items-center gap-2 border border-border p-3"
          >
            <strong className="mr-auto">{participant.nickname}</strong>
            <select
              className="h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
              value={participant.team_id ?? ""}
              disabled={pendingId === participant.id}
              onChange={(event) => reassignTeam(participant.id, event.target.value)}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pendingId === participant.id}
              onClick={() => kick(participant.id)}
            >
              Expulsar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AcceptedParticipantsList;
