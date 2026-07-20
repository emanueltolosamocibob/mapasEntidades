import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useJoinSession } from "../hooks/useJoinSession";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useUserProfile } from "../hooks/useUserProfile";
import { useSession } from "../contexts/SessionContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import RoleIcon, { ROLE_LABELS } from "./RoleIcon";

const selectClassName =
  "h-8 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

// Los <option> de un <select> nativo no heredan los colores de Tailwind/CSS
// vars del <select> en todos los navegadores — hay que fijarlos a mano.
const optionStyle = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" };

function JoinSessionForm() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code")?.toUpperCase() ?? "");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("infanteria");
  const [joinedCode, setJoinedCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const { state, joinSession } = useJoinSession();
  const session = useSession();
  const navigate = useNavigate();

  const userId = session.status === "ready" ? session.user.id : undefined;
  const isAnonymous = session.status === "ready" ? session.isAnonymous : true;
  const sessionId =
    state.status === "pending" ? state.participant.session_id : undefined;
  const myParticipant = useMyParticipant(sessionId, userId);

  const { state: profileState } = useUserProfile(
    isAnonymous ? undefined : userId,
    (session.status === "ready" ? (session.user.user_metadata?.full_name as string | undefined) : undefined) ?? null
  );

  useEffect(() => {
    if (myParticipant?.status === "accepted") {
      navigate(`/session/${joinedCode}/play`);
    }
  }, [myParticipant?.status, joinedCode, navigate]);

  const loadedProfileName = profileState.status === "ready" ? profileState.profile.display_name : undefined;
  const prefilledRef = useRef(false);

  // Precarga el nombre desde el perfil (MAP-34) una sola vez — solo si el
  // campo sigue vacío, para no pisar lo que el usuario ya haya tipeado.
  useEffect(() => {
    if (prefilledRef.current || !loadedProfileName) return;
    prefilledRef.current = true;
    setNickname((current) => current || loadedProfileName);
  }, [loadedProfileName]);

  const loadedProfileRole = profileState.status === "ready" ? profileState.profile.preferred_role : undefined;
  const roleInitializedRef = useRef(false);

  // Precarga el rol preferido del perfil una sola vez — si no tiene perfil
  // (anónimo o todavía sin guardar uno), se queda en el default "infanteria".
  useEffect(() => {
    if (roleInitializedRef.current || !loadedProfileRole) return;
    roleInitializedRef.current = true;
    setRole(loadedProfileRole);
  }, [loadedProfileRole]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCodeError(null);
    setNicknameError(null);

    let hasError = false;
    if (!code.trim()) {
      setCodeError("Ingresá un código válido.");
      hasError = true;
    }
    if (!nickname.trim()) {
      setNicknameError("Ingresá un nombre válido.");
      hasError = true;
    }
    if (hasError) return;

    const normalizedCode = code.trim().toUpperCase();
    setJoinedCode(normalizedCode);
    joinSession(normalizedCode, nickname.trim(), role);
  }

  if (state.status === "pending") {
    if (myParticipant?.status === "rejected") {
      return (
        <p className="text-sm text-muted-foreground">
          Tu solicitud para unirte como{" "}
          <strong className="text-foreground">{state.participant.nickname}</strong> fue
          rechazada por el anfitrión.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm">
          Solicitud enviada como{" "}
          <strong className="text-primary">{state.participant.nickname}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Esperando que el anfitrión te acepte y te asigne un equipo...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <Label
          htmlFor="join-code"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Código de partida
        </Label>
        <Input
          id="join-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="uppercase"
        />
        {codeError && <p className="text-xs text-destructive">{codeError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="join-nickname"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Nombre
        </Label>
        <Input
          id="join-nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        {nicknameError && <p className="text-xs text-destructive">{nicknameError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="join-role"
          className="text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Rol preferido
        </Label>
        <div className="flex items-center gap-2">
          <select
            id="join-role"
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
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <Button type="submit" disabled={state.status === "loading"} className="w-full">
        {state.status === "loading" ? "Enviando..." : "Unirse"}
      </Button>
    </form>
  );
}

export default JoinSessionForm;
