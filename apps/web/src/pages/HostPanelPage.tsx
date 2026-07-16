import { useParams } from "react-router";

function HostPanelPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Panel de anfitrión — sesión {code}</h1>
      <p>Acá van a ir las solicitudes de ingreso y las acciones de moderación (MAP-12, MAP-13).</p>
    </main>
  );
}

export default HostPanelPage;
