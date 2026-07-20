import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copiá apps/web/.env.example a apps/web/.env y completá los valores de tu proyecto de Supabase."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function ensureAnonymousSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }

  return data.user;
}

// "Asciende" la sesión anónima actual a una cuenta de Google sin perder el
// user_id (ver ARCHITECTURE.md §6.2/§6.5) — el historial ya jugado como
// anónimo queda asociado automáticamente, sin migración de datos. Requiere
// "Allow manual linking" habilitado en Supabase Auth (MAP-30).
export async function linkGoogleAccount(redirectTo: string = window.location.href) {
  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo },
  });
  if (error) {
    throw error;
  }
}
