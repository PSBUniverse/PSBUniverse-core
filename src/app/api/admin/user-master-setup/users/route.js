import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/user-master-setup/utils/supabase.js";
import {
  createUserMasterRecord,
  getUserMasterSetupViewModel,
} from "@/modules/admin/user-master-setup/services/userMasterSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readListLimit(request) {
  const url = new URL(request.url);
  const limitText = String(url.searchParams.get("limit") || "").trim();
  const parsed = Number(limitText);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }

  return Math.min(parsed, 200);
}

export async function GET(request) {
  try {
    const supabase = await getSupabase();
    const limit = readListLimit(request);
    const viewModel = await getUserMasterSetupViewModel(supabase, { limit });

    return NextResponse.json(
      {
        ok: true,
        users: viewModel.users,
        totalUsers: viewModel.totalUsers,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load users.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = await getSupabase();
    const user = await createUserMasterRecord(supabase, body);

    return NextResponse.json(
      {
        ok: true,
        user,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create user.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
