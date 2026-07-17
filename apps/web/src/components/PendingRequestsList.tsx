import { useState } from "react";
import { useModerateParticipant } from "../hooks/useModerateParticipant";
import { Button } from "./ui/button";

type Participant = { id: string; nickname: string; requested_at: string };
type Team = { id: string; name: string };

const selectClassName =
  "h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring disabled:opacity-50";

// Los <option> de un <select> nativo no heredan los colores de Tailwind/CSS
// vars del <select> en todos los navegadores — hay que fijarlos a mano.
const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

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
    return <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>;
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
              className={selectClassName}
              value={selectedTeam[participant.id] ?? ""}
              onChange={(event) =>
                setSelectedTeam((prev) => ({
                  ...prev,
                  [participant.id]: event.target.value,
                }))
              }
            >
              <option value="" disabled style={optionStyle}>
                Elegir equipo
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id} style={optionStyle}>
                  {team.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!selectedTeam[participant.id] || pendingId === participant.id}
              onClick={() => accept(participant.id, selectedTeam[participant.id])}
            >
              Aceptar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pendingId === participant.id}
              onClick={() => reject(participant.id)}
            >
              Rechazar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PendingRequestsList;
