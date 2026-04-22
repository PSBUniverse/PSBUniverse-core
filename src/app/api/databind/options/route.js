import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/core/supabase/admin";

export const dynamic = "force-dynamic";

const TABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

function noStoreHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const table = String(body.table || "").trim();
    const key = String(body.key || "").trim();
    const display = String(body.display || "").trim();

    if (!table || !TABLE_NAME_PATTERN.test(table)) {
      return NextResponse.json([], { headers: noStoreHeaders() });
    }
    if (!key || !FIELD_NAME_PATTERN.test(key)) {
      return NextResponse.json([], { headers: noStoreHeaders() });
    }
    if (!display || !FIELD_NAME_PATTERN.test(display)) {
      return NextResponse.json([], { headers: noStoreHeaders() });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(table)
      .select(`${key},${display}`)
      .order(display, { ascending: true });

    if (error) {
      return NextResponse.json([], { status: 500, headers: noStoreHeaders() });
    }

    const options = (data || []).map((row) => ({
      value: row[key],
      label: String(row[display] ?? row[key] ?? ""),
    }));

    return NextResponse.json(options, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json([], { status: 500, headers: noStoreHeaders() });
  }
}
