import { useParams } from "react-router";

function PlayPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Mapa — sesión {code}</h1>
      <p>Acá va el mapa en vivo con Leaflet (MAP-14) y el envío de posición (MAP-15).</p>
    </main>
  );
}

export default PlayPage;
