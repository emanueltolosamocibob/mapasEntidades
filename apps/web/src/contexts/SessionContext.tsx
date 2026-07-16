import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { ensureAnonymousSession } from "../lib/supabaseClient";

type SessionContextValue =
  | { status: "loading" }
  | { status: "ready"; user: User }
  | { status: "error"; message: string };

const SessionContext = createContext<SessionContextValue>({ status: "loading" });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<SessionContextValue>({ status: "loading" });

  useEffect(() => {
    ensureAnonymousSession()
      .then((user) => {
        if (!user) {
          setValue({ status: "error", message: "No se pudo crear la sesión anónima" });
          return;
        }
        setValue({ status: "ready", user });
      })
      .catch((error: Error) => setValue({ status: "error", message: error.message }));
  }, []);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
