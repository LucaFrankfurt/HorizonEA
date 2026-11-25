import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api/crud";
import { getDb } from "@/lib/db/client";
import { exportRows, resourceBySlug, toCsv } from "@/lib/import-export";

/**
 * GET /api/export/:resource?format=csv|json
 * Flat export of one collection including readable reference columns
 * (e.g. `sourceApplication` next to `sourceApplicationId`).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  try {
    const { resource: slug } = await ctx.params;
    const resource = resourceBySlug(slug);
    if (!resource) return json({ error: `Unknown resource "${slug}"` }, 404);
    const { columns, rows } = await exportRows(await getDb(), resource.key);
    const format = req.nextUrl.searchParams.get("format") ?? "csv";
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      return new Response(JSON.stringify(rows, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${slug}-${stamp}.json"`,
        },
      });
    }
    // UTF-8 BOM so spreadsheet tools detect the encoding.
    return new Response("﻿" + toCsv(columns, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-${stamp}.csv"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
