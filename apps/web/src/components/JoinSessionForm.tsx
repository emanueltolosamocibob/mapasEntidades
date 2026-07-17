import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useJoinSession } from "../hooks/useJoinSession";
import { useMyParticipant } from "../hooks/useMyParticipant";
import { useSession } from "../contexts/SessionContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function JoinSessionForm() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code")?.toUpperCase() ?? "");
  const [nickname, setNickname] = useState("");
  const [joinedCode, setJoinedCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const { state, joinSession } = useJoinSession();
  const session = useSession();
  const navigate = useNavigate();

  const userId = session.status === "ready" ? session.user.id : undefined;
  const sessionId =
    state.status === "pending" ? state.participant.session_id : undefined;
  const myParticipant = useMyParticipant(sessionId, userId);

  useEffect(() => {
    if (myParticipant?.status === "accepted") {
      navigate(`/session/${joinedCode}/play`);
    }
  }, [myParticipant?.status, joinedCode, navigate]);

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
    joinSession(normalizedCode, nickname.trim());
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
          Código de sesión
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
      <Button type="submit" disabled={state.status === "loading"} className="w-full">
        {state.status === "loading" ? "Enviando..." : "Unirse"}
      </Button>
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}

export default JoinSessionForm;
