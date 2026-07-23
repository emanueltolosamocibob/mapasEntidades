import { Route, Routes } from "react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { useSession } from "./contexts/SessionContext";
import AccountPage from "./pages/AccountPage";
import CreateOrJoinPage from "./pages/CreateOrJoinPage";
import EventsListPage from "./pages/EventsListPage";
import HomePage from "./pages/HomePage";
import HostPanelPage from "./pages/HostPanelPage";
import PlayPage from "./pages/PlayPage";
import ReplayPage from "./pages/ReplayPage";
import SessionSummaryPage from "./pages/SessionSummaryPage";

function App() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background text-sm tracking-[0.2em] text-muted-foreground uppercase">
        Conectando con Supabase...
      </main>
    );
  }

  if (session.status === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-8 text-sm text-destructive">
        Error de conexión: {session.message}
      </main>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/partida-rapida" element={<CreateOrJoinPage />} />
        <Route path="/eventos" element={<EventsListPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/session/:code/host" element={<HostPanelPage />} />
        <Route path="/session/:code/play" element={<PlayPage />} />
        <Route path="/session/:code/replay" element={<ReplayPage />} />
        <Route path="/session/:code/summary" element={<SessionSummaryPage />} />
      </Routes>
      <SpeedInsights />
      <Analytics />
    </>
  );
}

export default App;
