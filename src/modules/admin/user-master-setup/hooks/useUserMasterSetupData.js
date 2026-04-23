import { getSupabase } from "../utils/supabase.js";
import { getUserMasterSetupViewModel } from "../services/userMasterSetup.service.js";

export async function loadUserMasterSetupData() {
  const supabase = await getSupabase();
  return getUserMasterSetupViewModel(supabase);
}
