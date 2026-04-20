import { normalizeText } from "../utils/text.js";

function readFirstText(row, fields, fallback = "") {
  for (const field of fields) {
    const value = row?.[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function isActiveFlag(value) {
  if (value === false || value === 0) {
    return false;
  }

  const text = String(value ?? "").trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "f" || text === "n" || text === "no");
}

function buildStatusLabel(row) {
  const explicit = normalizeText(
    readFirstText(row, ["status_name", "sts_name", "status", "label", "status_desc"], ""),
    "",
  );

  if (explicit) {
    return explicit.toUpperCase();
  }

  return isActiveFlag(row?.is_active) ? "ACTIVE" : "INACTIVE";
}

function normalizeDateValue(value) {
  const text = normalizeText(value, "");
  if (!text) {
    return "";
  }

  const isoText = text.includes("T") ? text.split("T")[0] : text;
  return normalizeText(isoText, "");
}

function createMapById(rows, idField) {
  const mapValue = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const id = row?.[idField];
    if (id === undefined || id === null || id === "") {
      return;
    }

    mapValue.set(String(id), row);
  });

  return mapValue;
}

function buildComputedFullName(row) {
  const firstName = normalizeText(row?.first_name, "");
  const middleName = normalizeText(row?.middle_name, "");
  const lastName = normalizeText(row?.last_name, "");
  const username = normalizeText(readFirstText(row, ["username", "user_name"], ""), "");

  if (!firstName && !lastName) {
    return username || "--";
  }

  const composed = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  return composed || username || "--";
}

export function mapUserMasterRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return safeRows.map((row, index) => ({
    id: row?.user_id ?? `user-${index}`,
    user_id: row?.user_id ?? null,
    username: normalizeText(readFirstText(row, ["username", "user_name"], "--"), "--"),
    display_name: buildComputedFullName(row),
    full_name: buildComputedFullName(row),
    email: normalizeText(readFirstText(row, ["email", "user_email"], "--"), "--"),
    company_name: normalizeText(readFirstText(row, ["comp_name", "company_name", "company"], "--"), "--"),
    department_name: normalizeText(
      readFirstText(row, ["dept_name", "department_name", "department"], "--"),
      "--",
    ),
    status_label: buildStatusLabel(row),
    comp_id: row?.comp_id ?? null,
    dept_id: row?.dept_id ?? null,
    status_id: row?.status_id ?? null,
    is_active: isActiveFlag(row?.is_active),
  }));
}

export function mapUserMasterDetail(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const fullName = buildComputedFullName(row);

  return {
    id: row?.user_id ?? "",
    user_id: row?.user_id ?? null,
    auth_user_id: row?.auth_user_id ?? null,
    username: normalizeText(readFirstText(row, ["username", "user_name"], ""), ""),
    email: normalizeText(readFirstText(row, ["email", "user_email"], ""), ""),
    full_name: fullName,
    display_name: fullName,
    first_name: normalizeText(row?.first_name, ""),
    middle_name: normalizeText(row?.middle_name, ""),
    last_name: normalizeText(row?.last_name, ""),
    phone: normalizeText(row?.phone, ""),
    address: normalizeText(row?.address, ""),
    comp_id: row?.comp_id ?? null,
    dept_id: row?.dept_id ?? null,
    position: normalizeText(row?.position, ""),
    hire_date: normalizeDateValue(row?.hire_date),
    status_id: row?.status_id ?? null,
    status_label: buildStatusLabel(row),
    is_active: isActiveFlag(row?.is_active),
    company_name: normalizeText(readFirstText(row, ["comp_name", "company_name", "company"], ""), ""),
    department_name: normalizeText(readFirstText(row, ["dept_name", "department_name", "department"], ""), ""),
    last_login_at: normalizeText(readFirstText(row, ["last_login_at", "last_sign_in_at"], ""), ""),
  };
}

export function mapCompanies(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    comp_id: row?.comp_id ?? null,
    label: normalizeText(readFirstText(row, ["comp_name", "company_name", "name"], "Company"), "Company"),
    is_active: isActiveFlag(row?.is_active),
  }));
}

export function mapDepartments(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    dept_id: row?.dept_id ?? null,
    comp_id: row?.comp_id ?? null,
    label: normalizeText(readFirstText(row, ["dept_name", "department_name", "name"], "Department"), "Department"),
    is_active: isActiveFlag(row?.is_active),
  }));
}

export function mapStatuses(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    status_id: row?.status_id ?? null,
    label: normalizeText(readFirstText(row, ["sts_name", "status_name", "name", "status"], "Status"), "Status"),
    is_active: isActiveFlag(row?.is_active),
  }));
}

export function mapApplications(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    app_id: row?.app_id ?? null,
    label: normalizeText(readFirstText(row, ["app_name", "name", "app_code", "code"], "Application"), "Application"),
    is_active: isActiveFlag(row?.is_active),
  }));
}

export function mapRoles(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    role_id: row?.role_id ?? null,
    app_id: row?.app_id ?? null,
    label: normalizeText(readFirstText(row, ["role_name", "name", "code"], "Role"), "Role"),
    is_active: isActiveFlag(row?.is_active),
  }));
}

export function mapUserAccessRows(rows, lookups = {}) {
  const applicationsById = createMapById(lookups?.applications, "app_id");
  const rolesById = createMapById(lookups?.roles, "role_id");

  return (Array.isArray(rows) ? rows : [])
    .map((row, index) => {
      const appId = row?.app_id ?? null;
      const roleId = row?.role_id ?? null;
      const appLookup = applicationsById.get(String(appId ?? ""));
      const roleLookup = rolesById.get(String(roleId ?? ""));

      const accessKey =
        normalizeText(row?.uar_id, "")
        || normalizeText(row?.id, "")
        || `${String(appId ?? "")}:${String(roleId ?? "")}:${index}`;

      return {
        access_key: accessKey,
        user_id: row?.user_id ?? null,
        app_id: appId,
        role_id: roleId,
        application_name: normalizeText(
          readFirstText({ ...appLookup, ...row }, ["app_name", "label", "name", "app_code", "code"], "Application"),
          "Application",
        ),
        role_name: normalizeText(
          readFirstText({ ...roleLookup, ...row }, ["role_name", "label", "name", "code"], "Role"),
          "Role",
        ),
        is_active: isActiveFlag(row?.is_active),
      };
    })
    .sort((left, right) => {
      const appDiff = String(left.application_name || "").localeCompare(String(right.application_name || ""));
      if (appDiff !== 0) {
        return appDiff;
      }

      return String(left.role_name || "").localeCompare(String(right.role_name || ""));
    });
}
