import type { NextRequest } from "next/server";
import { ApiError, errorResponse, json } from "@/lib/api/crud";
import { getDb } from "@/lib/db/client";
import { importData, normalizePayload, parseCsv, resourceBySlug } from "@/lib/import-export";

const MAX_BYTES = 20 * 1024 * 1024;

/**
 * POST /api/import
 *
 * multipart/form-data: file (.json snapshot or .csv), resource (slug, required for CSV),
 *                      mode=merge|replace, dryRun=true|false
 * application/json:    a snapshot body; mode / dryRun as query parameters
 *
 * All-or-nothing: if any record is invalid nothing is written (HTTP 422 with a report).
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let payload;
    let mode: string | null;
    let dryRun: boolean;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new ApiError(400, "Missing file");
      if (file.size > MAX_BYTES) throw new ApiError(413, "File is larger than 20 MB");
      const text = await file.text();
      mode = String(form.get("mode") ?? "merge");
      dryRun = String(form.get("dryRun") ?? "false") === "true";
      const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv");
      try {
        if (isCsv) {
          const slug = String(form.get("resource") ?? "");
          const resource = resourceBySlug(slug);
          if (!resource) throw new ApiError(400, "Select the collection this CSV file contains");
          payload = { [resource.key]: parseCsv(text) };
        } else {
          payload = normalizePayload(JSON.parse(text));
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, error instanceof Error ? error.message : "File could not be read");
      }
    } else {
      mode = req.nextUrl.searchParams.get("mode") ?? "merge";
      dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
      try {
        payload = normalizePayload(await req.json());
      } catch (error) {
        throw new ApiError(400, error instanceof Error ? error.message : "Invalid JSON");
      }
    }

    if (mode !== "merge" && mode !== "replace") throw new ApiError(400, 'mode must be "merge" or "replace"');
    const report = await importData(await getDb(), payload, { mode, dryRun });
    return json(report, report.errors.length ? 422 : 200);
  } catch (error) {
    return errorResponse(error);
  }
}
