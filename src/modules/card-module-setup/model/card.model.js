export function isCardActive(card) {
  if (card?.is_active === false || card?.is_active === 0) return false;
  const text = String(card?.is_active ?? "").trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "f" || text === "n" || text === "no");
}

export function getCardDisplayName(card) {
  return card?.card_name || card?.name || card?.label || "Unknown";
}

export function getCardDescription(card) {
  return card?.card_desc || card?.description || "";
}

export function getCardRoutePath(card) {
  return card?.route_path || card?.route || card?.path || card?.href || "#";
}

export function getCardIcon(card) {
  return card?.icon || "bi-grid-3x3-gap";
}

export function getCardDisplayOrder(card, fallback = 0) {
  const candidates = [card?.display_order, card?.card_order, card?.sort_order, card?.order_no];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}
