import { NextResponse } from "next/server";
import { getSupabase } from "@/modules/admin/user-master-setup/utils/supabase.js";
import {
  createUserMasterAccessRecord,
  deleteUserMasterAccessRecord,
  getUserMasterAccessViewModel,
  updateUserMasterAccessRecord,
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

function parseIncludeInactive(request) {
  const url = new URL(request.url);
  const raw = String(url.searchParams.get("includeInactive") || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const userId = normalizeId(params?.userId);

    if (userId === null) {
      throw new Error("Invalid user id.");
    }

    const supabase = await getSupabase();
    const viewModel = await getUserMasterAccessViewModel(supabase, userId, {
      includeInactive: parseIncludeInactive(request),
    });

    return NextResponse.json(
      {
        ok: true,
        accessRows: viewModel.accessRows,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load access rows.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const userId = normalizeId(params?.userId);

    if (userId === null) {
      throw new Error("Invalid user id.");
    }

    const payload = await request.json().catch(() => ({}));
    const supabase = await getSupabase();
    const access = await createUserMasterAccessRecord(supabase, userId, payload);

    return NextResponse.json(
      {
        ok: true,
        access,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create access row.",
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

    const payload = await request.json().catch(() => ({}));
    const supabase = await getSupabase();
    const access = await updateUserMasterAccessRecord(supabase, userId, payload);

    return NextResponse.json(
      {
        ok: true,
        access,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to update access row.",
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

    const payload = await request.json().catch(() => ({}));
    const supabase = await getSupabase();
    const deleted = await deleteUserMasterAccessRecord(supabase, userId, payload);

    return NextResponse.json(
      {
        ok: true,
        deleted,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to deactivate access row.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
