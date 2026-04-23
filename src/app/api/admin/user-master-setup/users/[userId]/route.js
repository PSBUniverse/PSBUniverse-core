import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/user-master-setup/utils/supabase.js";
import {
  deleteUserMasterRecord,
  getUserMasterRecordById,
  updateUserMasterRecord,
} from "@/modules/admin/user-master-setup/services/userMasterSetup.service.js";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function normalizeId(value) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const asNumber = Number(text);
  return Number.isFinite(asNumber) ? asNumber : text;
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const userId = normalizeId(params?.userId);

    if (userId === null) {
      throw new Error("Invalid user id.");
    }

    const supabase = await getSupabase();
    const user = await getUserMasterRecordById(supabase, userId);

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
        error: error?.message || "Failed to load user.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const userId = normalizeId(params?.userId);

    if (userId === null) {
      throw new Error("Invalid user id.");
    }

    const body = await request.json().catch(() => ({}));
    const supabase = await getSupabase();
    const user = await updateUserMasterRecord(supabase, userId, body);

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
        error: error?.message || "Failed to update user.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const userId = normalizeId(params?.userId);

    if (userId === null) {
      throw new Error("Invalid user id.");
    }

    const supabase = await getSupabase();
    const result = await deleteUserMasterRecord(supabase, userId);

    return NextResponse.json(
      {
        ok: true,
        deleted: result,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to deactivate user.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
