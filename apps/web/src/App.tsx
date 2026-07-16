import { Route, Routes } from "react-router";
import { useSession } from "./contexts/SessionContext";
import CreateOrJoinPage from "./pages/CreateOrJoinPage";
import HostPanelPage from "./pages/HostPanelPage";
import PlayPage from "./pages/PlayPage";

function App() {
  const session = useSession();

  if (session.status === "loading") {
    return <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>Conectando con Supabase...</p>;
  }

  if (session.status === "error") {
    return (
      <p style={{ fontFamily: "sans-serif", padding: "2rem", color: "crimson" }}>
        Error de conexión: {session.message}
      </p>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<CreateOrJoinPage />} />
      <Route path="/session/:code/host" element={<HostPanelPage />} />
      <Route path="/session/:code/play" element={<PlayPage />} />
    </Routes>
  );
}

export default App;
