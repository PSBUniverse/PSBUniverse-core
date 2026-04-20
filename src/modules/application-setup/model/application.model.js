/**
 * Application Model
 * Defines application data structure and utilities
 */

export function isApplicationActive(app) {
  if (app.is_active === false || app.is_active === 0) return false;
  const text = String(app.is_active ?? "").trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "f" || text === "n" || text === "no");
}

export function getApplicationDisplayName(app) {
  return app.app_name || app.name || "Unknown";
}

export function getApplicationDescription(app) {
  return app.app_desc || app.description || "--";
}

export function getApplicationDisplayOrder(app, fallback = 0) {
  const candidates = [
    app?.display_order,
    app?.app_order,
    app?.sort_order,
    app?.order_no,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}
