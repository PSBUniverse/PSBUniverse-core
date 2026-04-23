import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/user-master-setup/utils/supabase.js";
import { getUserMasterLookups } from "@/modules/admin/user-master-setup/services/userMasterSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

export async function GET() {
  try {
    const supabase = await getSupabase();
    const lookups = await getUserMasterLookups(supabase);

    return NextResponse.json(
      {
        ok: true,
        lookups,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load lookups.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
