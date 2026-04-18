import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../modules/application-setup/src/utils/supabase.js";
import { createRoleRecord } from "../../../../../modules/application-setup/src/services/applicationSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readCreatePayload(body) {
  return {
    app_id: body?.app_id,
    role_name: body?.role_name,
    role_desc: body?.role_desc,
    is_active: body?.is_active,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = readCreatePayload(body);

    const supabase = await getSupabase();
    const role = await createRoleRecord(supabase, payload);

    return NextResponse.json(
      {
        ok: true,
        role,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create role.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
