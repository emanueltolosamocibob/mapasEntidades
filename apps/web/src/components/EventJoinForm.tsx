import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useJoinSession } from "../hooks/useJoinSession";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useSession } from "../contexts/SessionContext";
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
  requiresApproval,
  onJoined,
}: {
  code: string;
  teams: EventListingTeam[];
  requiresApproval: boolean;
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
  const session = useSession();

  const userId = session.status === "ready" ? session.user.id : undefined;
  const sessionId = state.status === "submitted" ? state.participant.session_id : undefined;
  const myParticipant = useMyParticipant(sessionId, userId);

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

  // Si la solicitud quedó "pending" (el host eligió requerir aprobación),
  // esto detecta cuando el host la acepta y recién ahí manda a jugar --
  // mismo patrón que JoinSessionForm para partidas rápidas.
  useEffect(() => {
    if (myParticipant?.status === "accepted") {
      navigate(`/session/${code}/play`);
    }
  }, [myParticipant?.status, code, navigate]);

  if (state.status === "submitted") {
    if (state.participant.status === "pending") {
      return (
        <div className="space-y-2">
          <p className="text-sm">
            Solicitud enviada como{" "}
            <strong className="text-primary">{state.participant.nickname}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Esperando que el anfitrión te acepte...
          </p>
        </div>
      );
    }

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
      <p className="text-xs text-muted-foreground">
        {requiresApproval
          ? "El anfitrión tiene que aceptar tu solicitud antes de que puedas ver el mapa."
          : "Te unís directo, sin esperar aprobación del anfitrión."}
      </p>
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
