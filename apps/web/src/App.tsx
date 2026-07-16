import { useEffect, useState } from "react";
import { ensureAnonymousSession } from "./lib/supabaseClient";

type ConnectionState =
  | { status: "loading" }
  | { status: "connected"; userId: string }
  | { status: "error"; message: string };

function App() {
  const [state, setState] = useState<ConnectionState>({ status: "loading" });

  useEffect(() => {
    ensureAnonymousSession()
      .then((user) => setState({ status: "connected", userId: user?.id ?? "" }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>mapasEntidades</h1>
      {state.status === "loading" && <p>Conectando con Supabase...</p>}
      {state.status === "connected" && (
        <p>
          Conectado. Sesión anónima creada: <code>{state.userId}</code>
        </p>
      )}
      {state.status === "error" && (
        <p style={{ color: "crimson" }}>Error de conexión: {state.message}</p>
      )}
    </main>
  );
}

export default App;
