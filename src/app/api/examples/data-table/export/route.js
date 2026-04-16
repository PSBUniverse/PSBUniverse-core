import { NextResponse } from "next/server";
import { buildDataTableExport, queryDataTableRows } from "../data";

export const dynamic = "force-dynamic";

function parseColumnKeys(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
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
    const searchParams = request.nextUrl.searchParams;
    const scope = String(searchParams.get("scope") || "all-filtered").toLowerCase();
    const format = String(searchParams.get("format") || "csv").toLowerCase();
    const columnKeys = parseColumnKeys(searchParams.get("columns"));

    const query = readRequestQuery(searchParams);
    const { rows } = queryDataTableRows(query, {
      paginate: scope === "current-page",
    });

    const exportFile = buildDataTableExport(rows, {
      format,
      columnKeys,
    });

    return new NextResponse(exportFile.content, {
      status: 200,
      headers: {
        "Content-Type": exportFile.mimeType,
        "Content-Disposition": `attachment; filename=\"${exportFile.fileName}\"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to export table data.",
      },
      { status: 500 },
    );
  }
}
