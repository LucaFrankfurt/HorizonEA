/**
 * Loads the demo data set.
 *   npm run db:seed            – seed only if the database is empty
 *   npm run db:seed -- --reset – wipe all data and re-seed (alias: npm run db:reset)
 *
 * Note: the embedded PGlite database can only be opened by one process at a
 * time – stop `npm run dev` first, or use "Reset demo data" on the
 * Import / Export page instead.
 */
import { count } from "drizzle-orm";
import { databaseKind, openDatabase } from "../src/lib/db/client";
import { applications } from "../src/lib/db/schema";
import { seedDatabase } from "../src/lib/db/seed";

async function main() {
  const reset = process.argv.includes("--reset");
  const handle = await openDatabase({ autoSeed: false });
  try {
    const [{ value }] = await handle.db.select({ value: count() }).from(applications);
    if (value > 0 && !reset) {
      console.log(`Database already contains ${value} applications – skipping. Use --reset to wipe and re-seed.`);
      return;
    }
    const result = await seedDatabase(handle.db, { reset });
    console.log(`✔ Seeded ${databaseKind()} database:`, result);
  } finally {
    await handle.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
