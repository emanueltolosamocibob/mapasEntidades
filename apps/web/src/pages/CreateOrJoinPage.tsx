import CreateSessionForm from "../components/CreateSessionForm";
import JoinSessionForm from "../components/JoinSessionForm";

function CreateOrJoinPage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>mapasEntidades</h1>

      <section>
        <h2>Crear sesión</h2>
        <CreateSessionForm />
      </section>

      <section>
        <h2>Unirse a sesión</h2>
        <JoinSessionForm />
      </section>
    </main>
  );
}

export default CreateOrJoinPage;
