import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type UserProfile = {
  display_name: string | null;
  preferred_role: string;
};

type ProfileState =
  | { status: "loading" }
  | { status: "ready"; profile: UserProfile }
  | { status: "error"; message: string };

export function useUserProfile(userId: string | undefined, defaultDisplayName: string | null) {
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  const refresh = useCallback(async () => {
    if (!userId) return;
    setState({ status: "loading" });

    const { data, error } = await supabase
      .from("users")
      .select("display_name, preferred_role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    if (data) {
      setState({ status: "ready", profile: data });
      return;
    }

    // Primera visita a /account: crear el perfil con el nombre de Google
    // como default, editable después.
    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({ id: userId, display_name: defaultDisplayName })
      .select("display_name, preferred_role")
      .single();

    if (insertError) {
      setState({ status: "error", message: insertError.message });
      return;
    }

    setState({ status: "ready", profile: created });
  }, [userId, defaultDisplayName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function updateProfile(patch: Partial<UserProfile>) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("users")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("display_name, preferred_role")
      .single();

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({ status: "ready", profile: data });
  }

  return { state, updateProfile };
}
