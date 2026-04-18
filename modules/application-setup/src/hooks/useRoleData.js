/**
 * useRoleData Hook
 * Facade for loading role data through services.
 */

import { getSupabase } from "../utils/supabase.js";
import { getRoleList } from "../services/applicationSetup.service.js";

export async function useRoleData() {
  const supabase = await getSupabase();

  const roles = await getRoleList(supabase);

  return {
    roles,
  };
}
