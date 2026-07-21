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

// Supabase devuelve los errores de linkIdentity como parámetros en la URL de
// redirect (tanto en query string como en el hash) en vez de tirarlos en la
// llamada original, porque el error ocurre recién después del round-trip a
// Google. Hay que leerlos al montar la pantalla de vuelta y limpiar la URL
// para que un refresh no vuelva a procesar el mismo error.
export function consumeOAuthRedirectError() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const code = hashParams.get("error_code") ?? searchParams.get("error_code");
  const description = hashParams.get("error_description") ?? searchParams.get("error_description");

  if (!code) {
    return null;
  }

  window.history.replaceState(null, "", window.location.pathname);
  return { code, description: description ?? "" };
}

// Cuando linkIdentity falla con "identity_already_exists" (la cuenta de
// Google ya está vinculada a otro usuario, ej. el jugador ya la usó desde
// otro dispositivo), la única forma de acceder a esa cuenta real es un login
// normal en vez de un link.
export async function signInWithGoogle(redirectTo: string = window.location.origin) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) {
    throw error;
  }
}
