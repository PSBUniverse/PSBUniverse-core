/**
 * Status Model
 * Defines status data access helpers for rendering/setup workflows.
 */

export function isStatusActive(status) {
  if (status?.is_active === false || status?.is_active === 0) return false;
  const text = String(status?.is_active ?? "").trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "f" || text === "n" || text === "no");
}

export function getStatusDisplayName(status) {
  return status?.sts_name || status?.status_name || status?.name || "Unknown";
}

export function getStatusDescription(status) {
  return status?.sts_desc || status?.status_desc || status?.description || "--";
}
