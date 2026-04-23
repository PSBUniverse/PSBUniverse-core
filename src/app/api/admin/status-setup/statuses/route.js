import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/status-setup/utils/supabase.js";
import { createStatusRecord } from "@/modules/admin/status-setup/services/statusSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readCreatePayload(body) {
  return {
    sts_name: body?.sts_name,
    sts_desc: body?.sts_desc,
    is_active: body?.is_active,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = readCreatePayload(body);

    const supabase = await getSupabase();
    const status = await createStatusRecord(supabase, payload);

    return NextResponse.json(
      {
        ok: true,
        status,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create status.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
