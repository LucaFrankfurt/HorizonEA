import { errorResponse } from "@/lib/api/crud";
import { getDb } from "@/lib/db/client";
import { exportSnapshot } from "@/lib/import-export";

/** GET /api/export – full JSON snapshot of the repository (backup / integration). */
export async function GET() {
  try {
    const snapshot = await exportSnapshot(await getDb());
    const stamp = snapshot.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(snapshot, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="horizon-ea-${stamp}.json"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
