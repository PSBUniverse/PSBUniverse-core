import { getSupabase } from "../utils/supabase.js";
import { getCardModuleSetupViewModel } from "../services/cardModuleSetup.service.js";

export async function loadCardModuleSetupData() {
  const supabase = await getSupabase();
  return getCardModuleSetupViewModel(supabase);
}
