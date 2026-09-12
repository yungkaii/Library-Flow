import { supabase } from "@/lib/supabase";
import type { LibrarySettings } from "@/types";

export async function getLibrarySettings(): Promise<LibrarySettings> {
  const { data, error } = await supabase
    .from("library_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return { ...data, fine_per_day: Number(data.fine_per_day) } as LibrarySettings;
}

export async function updateLibrarySettings(values: {
  library_name: string;
  address: string;
  phone: string;
  email: string;
  max_active_borrowings: number;
  loan_duration_days: number;
  fine_per_day: number;
  max_active_reservations: number;
  default_theme: LibrarySettings["default_theme"];
  compact_mode: boolean;
}) {
  const { data, error } = await supabase
    .from("library_settings")
    .upsert({ id: true, ...values }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, fine_per_day: Number(data.fine_per_day) } as LibrarySettings;
}
