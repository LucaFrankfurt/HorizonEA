import { sql } from "drizzle-orm";
import { json } from "@/lib/api/crud";
import { databaseKind, describeDbError, getDb } from "@/lib/db/client";

/**
 * GET /api/health        – liveness: 200 while the web server runs; the body
 *                          reports the database state ("ok" or "degraded").
 *                          Used by the container health check, so a database
 *                          problem shows up here instead of hiding the app.
 * GET /api/health?ready  – readiness: 503 unless the database is usable.
 */
export async function GET(req: Request) {
  const ready = new URL(req.url).searchParams.has("ready");
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return json({ status: "ok", database: { kind: databaseKind(), status: "ok" } });
  } catch (error) {
    const { code, message, hint } = describeDbError(error);
    console.error(`[horizon-ea] Health check: database unavailable${code ? ` (${code})` : ""}: ${message}`);
    return json(
      { status: "degraded", database: { kind: databaseKind(), status: "error", code, message, hint } },
      ready ? 503 : 200,
    );
  }
}
