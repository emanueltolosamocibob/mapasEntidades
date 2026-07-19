import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type PresetField = { id: string; name: string; lat: number; lng: number };

export function usePresetFields() {
  const [fields, setFields] = useState<PresetField[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("airsoft_preset_fields")
      .select("id, name, lat, lng")
      .order("name")
      .then(({ data }) => {
        if (!cancelled && data) setFields(data);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return fields;
}
