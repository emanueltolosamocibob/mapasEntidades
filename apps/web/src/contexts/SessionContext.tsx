import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { ensureAnonymousSession, supabase } from "../lib/supabaseClient";

type SessionContextValue =
  | { status: "loading" }
  | { status: "ready"; user: User; isAnonymous: boolean }
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
        setValue({ status: "ready", user, isAnonymous: user.is_anonymous ?? false });
      })
      .catch((error: Error) => setValue({ status: "error", message: error.message }));

    // Sin esto, el contexto no se entera de que el usuario terminó de
    // vincular su cuenta de Google (linkIdentity) hasta recargar la página
    // a mano después del redirect de vuelta desde el proveedor.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setValue({ status: "ready", user: session.user, isAnonymous: session.user.is_anonymous ?? false });
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
