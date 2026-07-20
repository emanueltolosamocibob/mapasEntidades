import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import RoleIcon, { ROLE_LABELS } from "./RoleIcon";
import { useHostJoinSession } from "../hooks/useHostJoinSession";
import { useUserProfile } from "../hooks/useUserProfile";

const selectClassName =
  "h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

// Los <option> de un <select> nativo no heredan los colores de Tailwind/CSS
// vars del <select> en todos los navegadores — hay que fijarlos a mano.
const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

type Team = { id: string; name: string; color: string | null };

function HostJoinForm({
  sessionId,
  teams,
  userId,
  defaultDisplayName,
  onJoined,
}: {
  sessionId: string;
  teams: Team[];
  userId: string;
  defaultDisplayName: string | null;
  onJoined: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { state: profileState } = useUserProfile(userId, defaultDisplayName);
  const [nickname, setNickname] = useState("");
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("infanteria");
  const { state, hostJoinSession } = useHostJoinSession();

  useEffect(() => {
    if (state.status === "success") onJoined();
  }, [state.status, onJoined]);

  function handleOpen() {
    if (profileState.status === "ready") {
      setNickname(profileState.profile.display_name ?? "");
      setRole(profileState.profile.preferred_role);
    }
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nickname.trim() || !teamId) return;
    hostJoinSession(sessionId, nickname.trim(), teamId, role);
  }

  if (state.status === "success") {
    return <p className="text-sm text-muted-foreground">Te uniste a esta partida...</p>;
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={handleOpen}>
        Unirme a esta partida
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Nombre</Label>
          <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Equipo</Label>
          <select
            className={selectClassName}
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
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
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Rol</Label>
          <div className="flex items-center gap-2">
            <select
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

        <Button type="submit" disabled={state.status === "loading" || !teamId}>
          {state.status === "loading" ? "Uniendo..." : "Unirme"}
        </Button>
      </div>
      {state.status === "error" && <p className="text-xs text-destructive">{state.message}</p>}
    </form>
  );
}

export default HostJoinForm;
