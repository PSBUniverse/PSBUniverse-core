import { getSupabase } from "../utils/supabase.js";
import { getCardModuleSetupViewModel } from "../services/cardModuleSetup.service.js";

export async function loadCardModuleSetupData() {
  const supabase = await getSupabase();
  return getCardModuleSetupViewModel(supabase);
}

export async function loadApplications() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("psb_s_application")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
