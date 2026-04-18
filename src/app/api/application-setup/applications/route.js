import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../modules/application-setup/src/utils/supabase.js";
import { createApplicationRecord } from "../../../../../modules/application-setup/src/services/applicationSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readCreatePayload(body) {
  return {
    app_name: body?.app_name,
    app_desc: body?.app_desc,
    is_active: body?.is_active,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = readCreatePayload(body);

    const supabase = await getSupabase();
    const application = await createApplicationRecord(supabase, payload);

    return NextResponse.json(
      {
        ok: true,
        application,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create application.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
