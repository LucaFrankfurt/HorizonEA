import { sql } from "drizzle-orm";
import { json } from "@/lib/api/crud";
import { databaseKind, getDb } from "@/lib/db/client";

/** GET /api/health – liveness / readiness probe (used by the Docker health check). */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return json({ status: "ok", database: databaseKind() });
  } catch (error) {
    console.error(error);
    return json({ status: "error", database: databaseKind() }, 503);
  }
}
