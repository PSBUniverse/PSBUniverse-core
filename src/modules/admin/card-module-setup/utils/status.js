export function getStatusBadgeColor(isActive) {
  return isActive ? { bg: "success", text: "light" } : { bg: "primary", text: "light" };
}

export function getStatusLabel(isActive) {
  return isActive ? "Active" : "Inactive";
}
