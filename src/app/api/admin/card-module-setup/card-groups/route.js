import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/card-module-setup/utils/supabase.js";
import { createCardGroupRecord } from "@/modules/admin/card-module-setup/services/cardModuleSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readCreatePayload(body) {
  return {
    app_id: body?.app_id,
    group_name: body?.group_name,
    group_desc: body?.group_desc,
    icon: body?.icon,
    is_active: body?.is_active,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = readCreatePayload(body);

    const supabase = await getSupabase();
    const cardGroup = await createCardGroupRecord(supabase, payload);

    return NextResponse.json(
      {
        ok: true,
        cardGroup,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create card group.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
