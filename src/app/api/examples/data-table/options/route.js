import { NextResponse } from "next/server";
import { getDataTableFilterOptions } from "../data";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

export async function GET() {
  try {
    return NextResponse.json(getDataTableFilterOptions(), { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json(
      {
        statusOptions: [],
        roleOptions: [],
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
