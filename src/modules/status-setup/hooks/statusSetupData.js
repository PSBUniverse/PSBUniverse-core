/**
 * Status Setup Data Loader
 * Provides the module data contract to the page via services.
 */

import { getSupabase } from "../utils/supabase.js";
import { getStatusSetupViewModel } from "../services/statusSetup.service.js";

export async function loadStatusSetupData() {
  const supabase = await getSupabase();

  return getStatusSetupViewModel(supabase);
}
