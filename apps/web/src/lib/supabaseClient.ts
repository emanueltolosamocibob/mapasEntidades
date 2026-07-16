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
