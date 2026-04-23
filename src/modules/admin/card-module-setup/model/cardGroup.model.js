export function isCardGroupActive(group) {
  if (group?.is_active === false || group?.is_active === 0) return false;
  const text = String(group?.is_active ?? "").trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "f" || text === "n" || text === "no");
}

export function getCardGroupDisplayName(group) {
  return group?.group_name || group?.name || group?.label || "Unknown";
}

export function getCardGroupDescription(group) {
  return group?.group_desc || group?.description || "";
}

export function getCardGroupIcon(group) {
  return group?.icon || "bi-collection";
}

export function getCardGroupDisplayOrder(group, fallback = 0) {
  const candidates = [group?.display_order, group?.group_order, group?.sort_order, group?.order_no];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}
