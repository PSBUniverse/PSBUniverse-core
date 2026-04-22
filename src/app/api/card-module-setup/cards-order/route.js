import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/card-module-setup/utils/supabase.js";
import { saveCardOrder } from "@/modules/card-module-setup/services/cardModuleSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readCardIds(body) {
  if (!body || typeof body !== "object") {
    return [];
  }

  if (Array.isArray(body.cardIds)) {
    return body.cardIds;
  }

  if (Array.isArray(body.orderedCardIds)) {
    return body.orderedCardIds;
  }

  return [];
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cardIds = readCardIds(body);

    const supabase = await getSupabase();
    const result = await saveCardOrder(supabase, cardIds);

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
        error: error?.message || "Failed to save card order.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
