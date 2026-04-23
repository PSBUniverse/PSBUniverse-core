import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/application-setup/utils/supabase.js";
import { saveApplicationOrder } from "@/modules/admin/application-setup/services/applicationSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readAppIds(body) {
  if (!body || typeof body !== "object") {
    return [];
  }

  if (Array.isArray(body.appIds)) {
    return body.appIds;
  }

  if (Array.isArray(body.orderedAppIds)) {
    return body.orderedAppIds;
  }

  return [];
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const appIds = readAppIds(body);

    const supabase = await getSupabase();
    const result = await saveApplicationOrder(supabase, appIds);

    return NextResponse.json(
      {
        ok: true,
        updatedCount: result.updatedCount,
        orderField: result.orderField,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to save application order.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
