import { useModerateParticipant } from "../hooks/useModerateParticipant";

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
    return <p>Todavía no hay jugadores aceptados.</p>;
  }

  return (
    <div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            <strong>{participant.nickname}</strong>{" "}
            <select
              value={participant.team_id ?? ""}
              disabled={pendingId === participant.id}
              onChange={(event) =>
                reassignTeam(participant.id, event.target.value)
              }
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>{" "}
            <button
              type="button"
              disabled={pendingId === participant.id}
              onClick={() => kick(participant.id)}
            >
              Expulsar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AcceptedParticipantsList;
