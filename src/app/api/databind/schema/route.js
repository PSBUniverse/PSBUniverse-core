import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/core/supabase/admin";

export const dynamic = "force-dynamic";

const TABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

function noStoreHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

export async function GET(request) {
  try {
    const table = request.nextUrl.searchParams.get("table") || "";
    const trimmed = table.trim();

    if (!trimmed || !TABLE_NAME_PATTERN.test(trimmed)) {
      return NextResponse.json(
        { ok: false, columns: [], error: "Invalid table name" },
        { status: 400, headers: noStoreHeaders() },
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch one row to infer column names (Supabase JS doesn't expose schema directly)
    const { data, error } = await supabase.from(trimmed).select("*").limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, columns: [], error: error.message },
        { status: 500, headers: noStoreHeaders() },
      );
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json(
      { ok: true, table: trimmed, columns },
      { headers: noStoreHeaders() },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, columns: [], error: err.message },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
