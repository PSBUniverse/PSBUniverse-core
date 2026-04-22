import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/core/supabase/admin";

export const dynamic = "force-dynamic";

const TABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 50;

function noStoreHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function validateTableName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed || !TABLE_NAME_PATTERN.test(trimmed)) {
    throw new Error(`Invalid table name: ${trimmed}`);
  }
  return trimmed;
}

function validateFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return "*";
  }
  const validated = fields
    .map((f) => String(f || "").trim())
    .filter((f) => FIELD_NAME_PATTERN.test(f));
  return validated.length > 0 ? validated.join(",") : "*";
}

function buildSearchFilter(search, searchFields) {
  const term = String(search || "").trim();
  if (!term) return null;

  const fields = Array.isArray(searchFields) ? searchFields : [];
  const validFields = fields
    .map((f) => String(f || "").trim())
    .filter((f) => FIELD_NAME_PATTERN.test(f));

  if (validFields.length === 0) return null;

  return validFields.map((f) => `${f}.ilike.%${term}%`).join(",");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const table = validateTableName(body.table);
    const selectFields = validateFields(body.fields);
    const search = String(body.search || "").trim();
    const searchFields = body.searchFields;
    const filters = body.filters && typeof body.filters === "object" ? body.filters : {};
    const sorting = body.sorting && typeof body.sorting === "object" ? body.sorting : {};
    const page = Math.max(1, toInt(body.page, 1));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(body.pageSize, DEFAULT_PAGE_SIZE)));

    const supabase = getSupabaseAdmin();
    let query = supabase.from(table).select(selectFields, { count: "exact" });

    // Apply search
    const searchFilter = buildSearchFilter(search, searchFields);
    if (searchFilter) {
      query = query.or(searchFilter);
    }

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
      if (!FIELD_NAME_PATTERN.test(field)) continue;

      if (value && typeof value === "object" && (value.start || value.end)) {
        // Date range filter
        if (value.start) {
          query = query.gte(field, value.start);
        }
        if (value.end) {
          query = query.lte(field, value.end);
        }
      } else if (value !== "" && value !== null && value !== undefined) {
        query = query.eq(field, value);
      }
    }

    // Apply sorting
    const sortKey = String(sorting.key || "").trim();
    if (sortKey && FIELD_NAME_PATTERN.test(sortKey)) {
      const ascending = String(sorting.direction || "").toLowerCase() !== "desc";
      query = query.order(sortKey, { ascending });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, rows: [], total: 0, page, pageSize, error: error.message },
        { status: 500, headers: noStoreHeaders() },
      );
    }

    return NextResponse.json(
      { ok: true, rows: data || [], total: count || 0, page, pageSize },
      { headers: noStoreHeaders() },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, rows: [], total: 0, page: 1, pageSize: 50, error: err.message },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
