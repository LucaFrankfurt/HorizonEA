import { ApiError, errorResponse, json } from "@/lib/api/crud";
import { getDb } from "@/lib/db/client";
import { clearDatabase, seedDatabase } from "@/lib/db/seed";

/**
 * POST /api/demo-data          – wipe everything and load the demo data set
 * POST /api/demo-data?empty=1  – wipe everything (start from scratch)
 * Disable with ALLOW_DEMO_RESET=false.
 */
export async function POST(req: Request) {
  try {
    if (process.env.ALLOW_DEMO_RESET === "false") throw new ApiError(403, "Demo data reset is disabled on this instance");
    const db = await getDb();
    if (new URL(req.url).searchParams.get("empty")) {
      await clearDatabase(db);
      return json({ cleared: true });
    }
    const result = await seedDatabase(db, { reset: true });
    return json({ seeded: result });
  } catch (error) {
    return errorResponse(error);
  }
}
