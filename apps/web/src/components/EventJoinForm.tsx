import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useJoinSession } from "../hooks/useJoinSession";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import RoleIcon, { ROLE_LABELS } from "./RoleIcon";
import type { EventListingTeam } from "../hooks/useEventListing";

const selectClassName =
  "h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

function EventJoinForm({
  code,
  teams,
  onJoined,
}: {
  code: string;
  teams: EventListingTeam[];
  onJoined: () => void;
}) {
  const joinableTeams = teams.filter(
    (team) => team.maxPlayers === null || team.acceptedCount < team.maxPlayers
  );

  const [teamId, setTeamId] = useState(() => joinableTeams[0]?.id ?? "");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("infanteria");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const { state, joinSession } = useJoinSession();
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setNicknameError(null);

    if (!nickname.trim()) {
      setNicknameError("Ingresá un nombre válido.");
      return;
    }

    joinSession(code, nickname.trim(), role, teamId);
  }

  useEffect(() => {
    if (state.status === "submitted") {
      onJoined();
    }
    // Solo se dispara una vez cuando el estado pasa a "submitted" -- onJoined
    // (refresh del listado) no debe formar parte de las deps o refrescaría
    // en loop cada vez que el padre re-renderiza y recrea la función.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (state.status === "submitted") {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Te uniste como <strong className="text-primary">{state.participant.nickname}</strong>.
        </p>
        <Button className="w-full" onClick={() => navigate(`/session/${code}/play`)}>
          Ir a la partida →
        </Button>
      </div>
    );
  }

  if (joinableTeams.length === 0) {
    return <p className="text-sm text-muted-foreground">No quedan equipos con cupo disponible.</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <Label
          htmlFor="event-join-team"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Equipo
        </Label>
        <select
          id="event-join-team"
          className={`${selectClassName} w-full`}
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
        >
          {joinableTeams.map((team) => (
            <option key={team.id} value={team.id} style={optionStyle}>
              {team.name}
              {team.maxPlayers !== null ? ` (${team.acceptedCount}/${team.maxPlayers})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="event-join-nickname"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Nombre
        </Label>
        <Input
          id="event-join-nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        {nicknameError && <p className="text-xs text-destructive">{nicknameError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="event-join-role"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Rol preferido
        </Label>
        <div className="flex items-center gap-2">
          <select
            id="event-join-role"
            className={selectClassName}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value} style={optionStyle}>
                {label}
              </option>
            ))}
          </select>
          <RoleIcon role={role} className="text-primary" />
        </div>
      </div>
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={state.status === "loading"} className="w-full">
        {state.status === "loading" ? "Enviando..." : "Inscribirme"}
      </Button>
    </form>
  );
}

export default EventJoinForm;
