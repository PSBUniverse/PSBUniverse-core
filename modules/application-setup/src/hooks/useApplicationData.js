/**
 * useApplicationData Hook
 * Facade for loading application data through services.
 */

import { getSupabase } from "../utils/supabase.js";
import { getApplicationList } from "../services/applicationSetup.service.js";

export async function useApplicationData() {
  const supabase = await getSupabase();

  const applications = await getApplicationList(supabase);
  const selectedAppId = applications[0]?.app_id ?? null;

  return {
    applications,
    selectedAppId,
  };
}
