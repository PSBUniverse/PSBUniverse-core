import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/card-module-setup/utils/supabase.js";
import { createCardRecord } from "@/modules/admin/card-module-setup/services/cardModuleSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readCreatePayload(body) {
  return {
    group_id: body?.group_id,
    app_id: body?.app_id,
    card_name: body?.card_name,
    card_desc: body?.card_desc,
    route_path: body?.route_path,
    icon: body?.icon,
    is_active: body?.is_active,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = readCreatePayload(body);

    const supabase = await getSupabase();
    const card = await createCardRecord(supabase, payload);

    return NextResponse.json(
      {
        ok: true,
        card,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create card.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
