import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/card-module-setup/utils/supabase.js";
import { saveCardGroupOrder } from "@/modules/admin/card-module-setup/services/cardModuleSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readGroupIds(body) {
  if (!body || typeof body !== "object") {
    return [];
  }

  if (Array.isArray(body.groupIds)) {
    return body.groupIds;
  }

  if (Array.isArray(body.orderedGroupIds)) {
    return body.orderedGroupIds;
  }

  return [];
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const groupIds = readGroupIds(body);

    const supabase = await getSupabase();
    const result = await saveCardGroupOrder(supabase, groupIds);

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
        error: error?.message || "Failed to save card group order.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
