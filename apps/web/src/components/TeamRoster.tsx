import type { RosterEntry } from "../hooks/useSessionRoster";

function TeamRoster({ roster }: { roster: RosterEntry[] }) {
  if (roster.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin jugadores registrados.</p>;
  }

  const teamIds = [...new Set(roster.map((entry) => entry.team_id))];

  return (
    <div className="space-y-4">
      {teamIds.map((teamId) => {
        const members = roster.filter((entry) => entry.team_id === teamId);
        const teamName = members[0]?.team_name ?? "Sin equipo";
        const teamColor = members[0]?.team_color ?? undefined;

        return (
          <div key={teamId ?? "sin-equipo"}>
            <p className="mb-1.5 text-xs tracking-[0.2em] uppercase" style={{ color: teamColor }}>
              <span className="underline decoration-2 underline-offset-4">{teamName}</span>{" "}
              <span className="text-muted-foreground normal-case no-underline">
                ({members.length})
              </span>
            </p>
            <ul className="space-y-1 text-sm">
              {members.map((member) => (
                <li key={member.participant_id} className="flex items-center justify-between gap-2">
                  <span>{member.nickname}</span>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default TeamRoster;
