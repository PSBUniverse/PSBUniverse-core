function normalizeLimit(value, fallback = 25) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 200);
}

function resolveUserTable() {
  return "psb_s_user";
}

function resolveAccessTable() {
  return "psb_m_userapproleaccess";
}

function resolveCompanyTable() {
  return "psb_s_company";
}

function resolveDepartmentTable() {
  return "psb_s_department";
}

function resolveStatusTable() {
  return "psb_s_status";
}

function resolveApplicationTable() {
  return "psb_s_application";
}

function resolveRoleTable() {
  return "psb_s_role";
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function computeFullName(row) {
  const firstName = normalizeText(row?.first_name);
  const middleName = normalizeText(row?.middle_name);
  const lastName = normalizeText(row?.last_name);
  const username = normalizeText(row?.username || row?.user_name);
  const composed = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

  if (!firstName && !lastName) {
    return username || composed || "--";
  }

  return composed || username || "--";
}

function appendComputedFullName(row) {
  if (!row || typeof row !== "object") {
    return row;
  }

  return {
    ...row,
    full_name: computeFullName(row),
  };
}

export async function fetchUserMasterRows(supabase, options = {}) {
  const limit = normalizeLimit(options?.limit, 25);
  const includeInactive = options?.includeInactive !== false;

  let query = supabase
    .from(resolveUserTable())
    .select("*")
    .order("user_id", { ascending: true })
    .limit(limit);

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to fetch users.");
  }

  return ensureArray(data).map((row) => appendComputedFullName(row));
}

export async function fetchUserMasterById(supabase, userId) {
  const { data, error } = await supabase
    .from(resolveUserTable())
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to fetch user.");
  }

  return appendComputedFullName(data);
}

export async function createUserMasterRow(supabase, payload) {
  const { data, error } = await supabase
    .from(resolveUserTable())
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create user.");
  }

  return appendComputedFullName(data);
}

export async function updateUserMasterById(supabase, userId, updates) {
  const { data, error } = await supabase
    .from(resolveUserTable())
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update user.");
  }

  return appendComputedFullName(data);
}

export async function deleteUserMasterById(supabase, userId) {
  const { data, error } = await supabase
    .from(resolveUserTable())
    .update({ is_active: false })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to deactivate user.");
  }

  return appendComputedFullName(data);
}

export async function fetchCompanyRows(supabase) {
  const { data, error } = await supabase
    .from(resolveCompanyTable())
    .select("*")
    .order("comp_name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch companies.");
  }

  return ensureArray(data);
}

export async function fetchDepartmentRows(supabase) {
  const { data, error } = await supabase
    .from(resolveDepartmentTable())
    .select("*")
    .order("dept_name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch departments.");
  }

  return ensureArray(data);
}

export async function fetchStatusRows(supabase) {
  const { data, error } = await supabase
    .from(resolveStatusTable())
    .select("*")
    .order("status_id", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch statuses.");
  }

  return ensureArray(data);
}

export async function fetchApplicationRows(supabase) {
  const { data, error } = await supabase
    .from(resolveApplicationTable())
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch applications.");
  }

  return ensureArray(data);
}

export async function fetchRoleRows(supabase, options = {}) {
  let query = supabase
    .from(resolveRoleTable())
    .select("*")
    .order("role_name", { ascending: true });

  if (options?.appId !== undefined && options?.appId !== null && options?.appId !== "") {
    query = query.eq("app_id", options.appId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to fetch roles.");
  }

  return ensureArray(data);
}

export async function fetchUserAccessRows(supabase, userId, options = {}) {
  const includeInactive = options?.includeInactive !== false;

  let query = supabase
    .from(resolveAccessTable())
    .select("*")
    .eq("user_id", userId)
    .order("app_id", { ascending: true })
    .order("role_id", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to fetch user access rows.");
  }

  return ensureArray(data);
}

export async function createUserAccessRow(supabase, payload) {
  const { data, error } = await supabase
    .from(resolveAccessTable())
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create user access row.");
  }

  return data;
}

export async function updateUserAccessRows(supabase, userId, originalAppId, originalRoleId, updates) {
  const { data, error } = await supabase
    .from(resolveAccessTable())
    .update(updates)
    .eq("user_id", userId)
    .eq("app_id", originalAppId)
    .eq("role_id", originalRoleId)
    .select("*");

  if (error) {
    throw new Error(error.message || "Failed to update user access row.");
  }

  return ensureArray(data);
}

export async function deactivateUserAccessRows(supabase, userId, appId, roleId) {
  const { data, error } = await supabase
    .from(resolveAccessTable())
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("role_id", roleId)
    .select("*");

  if (error) {
    throw new Error(error.message || "Failed to deactivate user access row.");
  }

  return ensureArray(data);
}

export async function deactivateAllUserAccessRows(supabase, userId) {
  const { data, error } = await supabase
    .from(resolveAccessTable())
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true)
    .select("*");

  if (error) {
    throw new Error(error.message || "Failed to deactivate all user access rows.");
  }

  return ensureArray(data);
}
