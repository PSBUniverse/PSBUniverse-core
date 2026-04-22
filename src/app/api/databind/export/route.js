import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/core/supabase/admin";

export const dynamic = "force-dynamic";

const TABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const MAX_EXPORT_ROWS = 10000;

function noStoreHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

function validateTableName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed || !TABLE_NAME_PATTERN.test(trimmed)) {
    throw new Error(`Invalid table name: ${trimmed}`);
  }
  return trimmed;
}

function validateFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return [];
  return fields
    .map((f) => String(f || "").trim())
    .filter((f) => FIELD_NAME_PATTERN.test(f));
}

function buildSearchFilter(search, searchFields) {
  const term = String(search || "").trim();
  if (!term) return null;
  const fields = Array.isArray(searchFields) ? searchFields : [];
  const valid = fields.map((f) => String(f || "").trim()).filter((f) => FIELD_NAME_PATTERN.test(f));
  if (!valid.length) return null;
  return valid.map((f) => `${f}.ilike.%${term}%`).join(",");
}

function escapeCsvValue(value, delimiter) {
  const raw = String(value ?? "");
  if (delimiter === "\t") {
    return raw.replace(/\t/g, " ").replace(/\r?\n/g, " ");
  }
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const table = validateTableName(body.table);
    const format = String(body.format || "csv").toLowerCase() === "excel" ? "excel" : "csv";
    const columnKeys = validateFields(body.columns);
    const columnLabels = body.columnLabels && typeof body.columnLabels === "object" ? body.columnLabels : {};
    const search = String(body.search || "").trim();
    const searchFields = body.searchFields;
    const filters = body.filters && typeof body.filters === "object" ? body.filters : {};
    const sorting = body.sorting && typeof body.sorting === "object" ? body.sorting : {};

    const selectFields = columnKeys.length > 0 ? columnKeys.join(",") : "*";

    const supabase = getSupabaseAdmin();
    let query = supabase.from(table).select(selectFields).limit(MAX_EXPORT_ROWS);

    const searchFilter = buildSearchFilter(search, searchFields);
    if (searchFilter) {
      query = query.or(searchFilter);
    }

    for (const [field, value] of Object.entries(filters)) {
      if (!FIELD_NAME_PATTERN.test(field)) continue;
      if (value && typeof value === "object" && (value.start || value.end)) {
        if (value.start) query = query.gte(field, value.start);
        if (value.end) query = query.lte(field, value.end);
      } else if (value !== "" && value !== null && value !== undefined) {
        query = query.eq(field, value);
      }
    }

    const sortKey = String(sorting.key || "").trim();
    if (sortKey && FIELD_NAME_PATTERN.test(sortKey)) {
      const ascending = String(sorting.direction || "").toLowerCase() !== "desc";
      query = query.order(sortKey, { ascending });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: noStoreHeaders() },
      );
    }

    const rows = data || [];
    const exportColumns = columnKeys.length > 0
      ? columnKeys
      : rows.length > 0 ? Object.keys(rows[0]) : [];

    const delimiter = format === "excel" ? "\t" : ",";
    const headerLine = exportColumns
      .map((key) => escapeCsvValue(columnLabels[key] || key, delimiter))
      .join(delimiter);
    const dataLines = rows.map((row) =>
      exportColumns.map((key) => escapeCsvValue(row[key], delimiter)).join(delimiter),
    );
    const content = [headerLine, ...dataLines].join("\n");

    const ext = format === "excel" ? "xls" : "csv";
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${table}-export-${timestamp}.${ext}`;
    const mimeType = format === "excel"
      ? "application/vnd.ms-excel; charset=utf-8"
      : "text/csv; charset=utf-8";

    return new Response(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        ...noStoreHeaders(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
