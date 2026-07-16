import CreateSessionForm from "../components/CreateSessionForm";

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
        <p>Acá va el formulario de "unirse a sesión" (MAP-11).</p>
      </section>
    </main>
  );
}

export default CreateOrJoinPage;
