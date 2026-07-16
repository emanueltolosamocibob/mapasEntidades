import { useState } from "react";
import { useModerateParticipant } from "../hooks/useModerateParticipant";

type Participant = { id: string; nickname: string; requested_at: string };
type Team = { id: string; name: string };

function PendingRequestsList({
  participants,
  teams,
}: {
  participants: Participant[];
  teams: Team[];
}) {
  const { accept, reject, pendingId, error } = useModerateParticipant();
  const [selectedTeam, setSelectedTeam] = useState<Record<string, string>>({});

  if (participants.length === 0) {
    return <p>No hay solicitudes pendientes.</p>;
  }

  return (
    <div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            <strong>{participant.nickname}</strong>{" "}
            <select
              value={selectedTeam[participant.id] ?? ""}
              onChange={(event) =>
                setSelectedTeam((prev) => ({
                  ...prev,
                  [participant.id]: event.target.value,
                }))
              }
            >
              <option value="" disabled>
                Elegir equipo
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>{" "}
            <button
              type="button"
              disabled={!selectedTeam[participant.id] || pendingId === participant.id}
              onClick={() => accept(participant.id, selectedTeam[participant.id])}
            >
              Aceptar
            </button>{" "}
            <button
              type="button"
              disabled={pendingId === participant.id}
              onClick={() => reject(participant.id)}
            >
              Rechazar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PendingRequestsList;
