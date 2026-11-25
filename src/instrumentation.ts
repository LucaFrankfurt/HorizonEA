/**
 * Runs once when the Next.js server starts. In PostgreSQL mode the database is
 * connected (and migrated / seeded) in the background right away, so start-up
 * problems show up clearly in the container logs instead of on first request.
 * Not awaited: the web server must come up even if the database is down.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL) return; // embedded PGlite opens lazily

  const { getDb, describeDbError } = await import("./lib/db/client");
  console.info("[horizon-ea] Connecting to PostgreSQL…");
  getDb().then(
    () => console.info("[horizon-ea] Database ready (migrations applied)."),
    (error) => {
      const { code, message, hint } = describeDbError(error);
      console.error(`[horizon-ea] Database unavailable${code ? ` (${code})` : ""}: ${message}`);
      if (hint) console.error(`[horizon-ea] Hint: ${hint}`);
      console.error("[horizon-ea] The web server keeps running; the connection is retried on the next request.");
    },
  );
}
