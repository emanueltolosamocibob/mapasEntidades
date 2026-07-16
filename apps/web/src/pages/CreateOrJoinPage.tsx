import { useSession } from "../contexts/SessionContext";

function CreateOrJoinPage() {
  const session = useSession();
  const userId = session.status === "ready" ? session.user.id : "";

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>mapasEntidades</h1>
      <p>
        Conectado. Sesión anónima: <code>{userId}</code>
      </p>
      <p>Acá van a ir los formularios de "crear sesión" y "unirse a sesión" (MAP-10, MAP-11).</p>
    </main>
  );
}

export default CreateOrJoinPage;
