/**
 * Application Setup Data Loader
 * Provides the module's data contract to the page via services.
 */

import { getSupabase } from "../utils/supabase.js";
import { getApplicationSetupViewModel } from "../services/applicationSetup.service.js";

export async function loadApplicationSetupData() {
  const supabase = await getSupabase();

  return getApplicationSetupViewModel(supabase);
}
