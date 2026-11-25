/**
 * Applies pending database migrations.
 *   npm run db:migrate
 * Uses DATABASE_URL (PostgreSQL) when set, otherwise the embedded PGlite database.
 */
import { databaseKind, openDatabase } from "../src/lib/db/client";

async function main() {
  const handle = await openDatabase({ autoSeed: false });
  console.log(`✔ Migrations applied (${databaseKind()})`);
  await handle.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
