/**
 * Role Model
 * Defines role data structure and utilities
 */

export function isRoleActive(role) {
  if (role.is_active === false || role.is_active === 0) return false;
  const text = String(role.is_active ?? "").trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "f" || text === "n" || text === "no");
}

export function getRoleDisplayName(role) {
  return role.role_name || role.name || "Unknown";
}

export function getRoleDescription(role) {
  return role.role_desc || role.description || "--";
}
