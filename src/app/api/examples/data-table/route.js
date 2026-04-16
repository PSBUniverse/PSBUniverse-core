import { NextResponse } from "next/server";
import { queryDataTableRows } from "./data";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function readRequestQuery(searchParams) {
  return {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    role: searchParams.get("role") ?? "",
    createdStart: searchParams.get("createdStart") ?? "",
    createdEnd: searchParams.get("createdEnd") ?? "",
    sortKey: searchParams.get("sortKey") ?? "",
    sortDirection: searchParams.get("sortDirection") ?? "desc",
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? 50,
  };
}

export async function GET(request) {
  try {
    const query = readRequestQuery(request.nextUrl.searchParams);
    const result = queryDataTableRows(query, { paginate: true });

    return NextResponse.json(result, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json(
      {
        rows: [],
        total: 0,
        page: 1,
        pageSize: 50,
        sort: {
          key: "",
          direction: "",
        },
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
