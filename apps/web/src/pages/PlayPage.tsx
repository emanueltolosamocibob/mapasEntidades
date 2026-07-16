import { useParams } from "react-router";
import { useSessionByCode } from "../hooks/useSessionByCode";
import { usePositions } from "../hooks/usePositions";
import MapView from "../components/MapView";

function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const sessionByCode = useSessionByCode(code);
  const sessionId =
    sessionByCode.status === "found" ? sessionByCode.session.id : undefined;
  const { positions } = usePositions(sessionId);

  const restriction =
    sessionByCode.status === "found" &&
    sessionByCode.session.origin_lat !== null &&
    sessionByCode.session.origin_lng !== null &&
    sessionByCode.session.movement_radius_m !== null
      ? {
          lat: sessionByCode.session.origin_lat,
          lng: sessionByCode.session.origin_lng,
          radiusM: sessionByCode.session.movement_radius_m,
        }
      : null;

  if (sessionByCode.status === "loading") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p>Cargando sesión...</p>
      </main>
    );
  }

  if (sessionByCode.status === "not-found") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p>Sesión no encontrada (o no tenés permiso para verla).</p>
      </main>
    );
  }

  if (sessionByCode.status === "error") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <p style={{ color: "crimson" }}>{sessionByCode.message}</p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "sans-serif" }}>
      <div style={{ padding: "1rem 2rem" }}>
        <h1>
          {sessionByCode.session.name} ({code})
        </h1>
      </div>
      <MapView positions={positions} restriction={restriction} />
    </main>
  );
}

export default PlayPage;
