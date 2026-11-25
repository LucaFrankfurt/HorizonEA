import { errorResponse, json } from "@/lib/api/crud";
import { buildDashboard } from "@/lib/data/dashboard";
import { loadModel } from "@/lib/data/model";

/** GET /api/dashboard – KPIs, EOL warnings and risk radar as JSON (for reporting tools). */
export async function GET() {
  try {
    return json(buildDashboard(await loadModel()));
  } catch (error) {
    return errorResponse(error);
  }
}
