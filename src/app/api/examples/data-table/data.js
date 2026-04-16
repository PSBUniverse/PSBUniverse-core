const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Analyst", value: "analyst" },
  { label: "Viewer", value: "viewer" },
];

const TEAM_OPTIONS = ["Platform", "Finance", "Operations", "Audit", "Risk", "Support"];

const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Casey",
  "Taylor",
  "Morgan",
  "Quinn",
  "Reese",
  "Drew",
  "Jamie",
  "Riley",
  "Parker",
  "Emerson",
];

const LAST_NAMES = [
  "Nguyen",
  "Carter",
  "Lopez",
  "Patel",
  "Rivera",
  "Kim",
  "Johnson",
  "Wright",
  "Torres",
  "Walker",
  "Allen",
  "Price",
];

const EXPORT_COLUMN_DEFINITIONS = [
  { key: "employee_code", label: "Employee Code" },
  { key: "full_name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "team", label: "Team" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created At" },
];

const SORTABLE_KEYS = new Set(EXPORT_COLUMN_DEFINITIONS.map((column) => column.key));
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

const MOCK_ROWS = Array.from({ length: 180 }, (_, index) => {
  const id = index + 1;
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(index * 5) % LAST_NAMES.length];
  const status = STATUS_OPTIONS[(index * 7) % STATUS_OPTIONS.length].value;
  const role = ROLE_OPTIONS[(index * 3) % ROLE_OPTIONS.length].value;
  const team = TEAM_OPTIONS[(index * 2) % TEAM_OPTIONS.length];

  const createdAt = new Date(Date.UTC(2025, 0, 1));
  createdAt.setUTCDate(createdAt.getUTCDate() + index * 2);

  return {
    id,
    employee_code: `EMP-${String(id).padStart(4, "0")}`,
    full_name: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}${id}@psbuniverse.local`.toLowerCase(),
    team,
    role,
    status,
    created_at: createdAt.toISOString().slice(0, 10),
  };
});

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getOptionLabel(options, value) {
  const normalized = normalizeText(value);
  const matched = options.find((option) => normalizeText(option.value) === normalized);
  return matched ? matched.label : String(value || "");
}

function parseDateOnly(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function compareValues(left, right) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  const leftDate = Date.parse(String(left));
  const rightDate = Date.parse(String(right));

  if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
    return leftDate - rightDate;
  }

  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function escapeSeparatedValue(value, delimiter) {
  const raw = String(value ?? "");

  if (delimiter === "\t") {
    return raw.replace(/\t/g, " ").replace(/\r?\n/g, " ");
  }

  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/\"/g, '""')}"`;
  }

  return raw;
}

function resolveSortKey(value) {
  const candidate = String(value || "").trim();

  if (!candidate) {
    return "";
  }

  return SORTABLE_KEYS.has(candidate) ? candidate : "";
}

function resolveSortDirection(value) {
  return String(value || "desc").toLowerCase() === "asc" ? "asc" : "desc";
}

function matchesSearch(row, query) {
  if (!query) return true;

  return [
    row.employee_code,
    row.full_name,
    row.email,
    row.team,
    row.role,
    row.status,
    row.created_at,
  ].some((field) => normalizeText(field).includes(query));
}

function matchesDateRange(rowDateText, startDate, endDate) {
  if (!startDate && !endDate) return true;

  const rowDate = parseDateOnly(rowDateText);
  if (!rowDate) return false;

  if (startDate && rowDate.getTime() < startDate.getTime()) return false;
  if (endDate && rowDate.getTime() > endDate.getTime()) return false;

  return true;
}

export function getDataTableFilterOptions() {
  return {
    statusOptions: STATUS_OPTIONS,
    roleOptions: ROLE_OPTIONS,
  };
}

export function queryDataTableRows(
  {
    search = "",
    status = "",
    role = "",
    createdStart = "",
    createdEnd = "",
    sortKey = "",
    sortDirection = "desc",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = {},
  { paginate = true } = {},
) {
  const normalizedSearch = normalizeText(search);
  const normalizedStatus = normalizeText(status);
  const normalizedRole = normalizeText(role);
  const startDate = parseDateOnly(createdStart);
  const endDate = parseDateOnly(createdEnd);

  const resolvedSortKey = resolveSortKey(sortKey);
  const resolvedSortDirection = resolveSortDirection(sortDirection);

  const filteredRows = MOCK_ROWS.filter((row) => {
    if (!matchesSearch(row, normalizedSearch)) return false;
    if (normalizedStatus && normalizeText(row.status) !== normalizedStatus) return false;
    if (normalizedRole && normalizeText(row.role) !== normalizedRole) return false;
    if (!matchesDateRange(row.created_at, startDate, endDate)) return false;

    return true;
  }).slice();

  if (resolvedSortKey) {
    filteredRows.sort((left, right) => {
      const comparison = compareValues(left[resolvedSortKey], right[resolvedSortKey]);
      return resolvedSortDirection === "asc" ? comparison : comparison * -1;
    });
  }

  const total = filteredRows.length;
  const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(pageSize, DEFAULT_PAGE_SIZE)));
  const maxPage = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(maxPage, Math.max(1, toInt(page, 1)));

  const pagedRows = paginate
    ? filteredRows.slice((safePage - 1) * safePageSize, safePage * safePageSize)
    : filteredRows;

  const rows = pagedRows.map((row) => ({
    ...row,
    status_label: getOptionLabel(STATUS_OPTIONS, row.status),
    role_label: getOptionLabel(ROLE_OPTIONS, row.role),
  }));

  return {
    rows,
    total,
    page: safePage,
    pageSize: safePageSize,
    sort: {
      key: resolvedSortKey,
      direction: resolvedSortKey ? resolvedSortDirection : "",
    },
  };
}

export function buildDataTableExport(rows, { format = "csv", columnKeys = [] } = {}) {
  const normalizedFormat = String(format || "csv").toLowerCase() === "excel" ? "excel" : "csv";
  const delimiter = normalizedFormat === "excel" ? "\t" : ",";

  const allowedColumns = new Set(EXPORT_COLUMN_DEFINITIONS.map((column) => column.key));
  const requestedColumns = Array.isArray(columnKeys)
    ? columnKeys.map((key) => String(key || "").trim()).filter((key) => allowedColumns.has(key))
    : [];

  const selectedColumns =
    requestedColumns.length > 0
      ? EXPORT_COLUMN_DEFINITIONS.filter((column) => requestedColumns.includes(column.key))
      : EXPORT_COLUMN_DEFINITIONS;

  const headerLine = selectedColumns.map((column) => escapeSeparatedValue(column.label, delimiter)).join(delimiter);
  const dataLines = rows.map((row) =>
    selectedColumns.map((column) => escapeSeparatedValue(row[column.key], delimiter)).join(delimiter),
  );

  const fileExtension = normalizedFormat === "excel" ? "xls" : "csv";
  const timeStamp = new Date().toISOString().slice(0, 10);

  return {
    content: [headerLine, ...dataLines].join("\n"),
    fileName: `data-table-export-${timeStamp}.${fileExtension}`,
    mimeType:
      normalizedFormat === "excel"
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8",
  };
}
