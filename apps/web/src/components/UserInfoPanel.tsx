import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import RoleIcon, { ROLE_LABELS } from "./RoleIcon";
import { useUserProfile } from "../hooks/useUserProfile";

const NAME_MAX_LENGTH = 20;

const selectClassName =
  "h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

// Los <option> de un <select> nativo no heredan los colores de Tailwind/CSS
// vars del <select> en todos los navegadores — hay que fijarlos a mano.
const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

function UserInfoPanel({
  userId,
  defaultDisplayName,
}: {
  userId: string;
  defaultDisplayName: string | null;
}) {
  const { state, updateProfile } = useUserProfile(userId, defaultDisplayName);
  const [name, setName] = useState("");
  const loadedDisplayName = state.status === "ready" ? state.profile.display_name : undefined;

  useEffect(() => {
    if (loadedDisplayName !== undefined) setName(loadedDisplayName ?? "");
  }, [loadedDisplayName]);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-destructive">{state.message}</p>;
  }

  function handleNameBlur() {
    const trimmed = name.trim().slice(0, NAME_MAX_LENGTH);
    if (trimmed !== (state.status === "ready" ? state.profile.display_name ?? "" : "")) {
      updateProfile({ display_name: trimmed });
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor="profile-name" className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Nombre
        </Label>
        <Input
          id="profile-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          onBlur={handleNameBlur}
        />
        {name.length >= NAME_MAX_LENGTH ? (
          <p className="text-xs text-destructive">Llegaste al máximo de caracteres permitidos.</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Se usa para autocompletar tu nombre al unirte a una partida.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-role" className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Rol preferido
        </Label>
        <div className="flex items-center gap-2">
          <select
            id="profile-role"
            className={selectClassName}
            value={state.profile.preferred_role}
            onChange={(event) => updateProfile({ preferred_role: event.target.value })}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value} style={optionStyle}>
                {label}
              </option>
            ))}
          </select>
          <RoleIcon role={state.profile.preferred_role} className="text-primary" />
        </div>
      </div>
    </div>
  );
}

export default UserInfoPanel;
