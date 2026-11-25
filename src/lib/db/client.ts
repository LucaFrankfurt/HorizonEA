import { mkdirSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;
export type DatabaseKind = "postgres" | "pglite";

interface DbHandle {
  db: Database;
  kind: DatabaseKind;
  close: () => Promise<void>;
}

declare global {
  var __horizonDb: Promise<DbHandle> | undefined;
}

export function migrationsFolder() {
  return process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
}

export function databaseKind(): DatabaseKind {
  return process.env.DATABASE_URL ? "postgres" : "pglite";
}

/**
 * Opens the database connection, applies pending migrations and – on a brand
 * new database – optionally loads the demo data set.
 *
 * - `DATABASE_URL` set   → PostgreSQL via node-postgres (Docker / production).
 * - `DATABASE_URL` unset → embedded PostgreSQL (PGlite, WASM) persisted to
 *                          `PGLITE_DATA_DIR` (default `./data/pglite`). Zero setup.
 */
async function open(options: { autoSeed: boolean }): Promise<DbHandle> {
  let handle: DbHandle;

  if (process.env.DATABASE_URL) {
    const { default: pg } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      connectionTimeoutMillis: 10_000,
    });
    const db = drizzle(pool, { schema });
    handle = { db, kind: "postgres", close: () => pool.end() };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), "data", "pglite");
    if (!dataDir.includes("://")) mkdirSync(dataDir, { recursive: true }); // memory:// is used by tests
    const client = new PGlite(dataDir);
    await client.waitReady;
    const db = drizzle(client, { schema }) as unknown as Database;
    handle = { db, kind: "pglite", close: () => client.close() };
  }

  try {
    const fresh = await isFreshDatabase(handle.db);
    await runMigrations(handle);

    const seedSetting = process.env.SEED_DEMO_DATA;
    const shouldSeed = seedSetting ? seedSetting === "true" : handle.kind === "pglite";
    if (options.autoSeed && fresh && shouldSeed) {
      const { seedDatabase } = await import("./seed");
      await seedDatabase(handle.db);
      console.info("[horizon-ea] Fresh database detected – demo data loaded.");
    }
    return handle;
  } catch (error) {
    // Don't leak pools / file locks when the next request retries.
    await handle.close().catch(() => {});
    throw error;
  }
}

/**
 * Turns a database error into a short message plus an actionable hint (used in
 * logs and by /api/health). Never contains credentials.
 */
export function describeDbError(error: unknown): { code?: string; message: string; hint?: string } {
  let root = error as { code?: string; message?: string; cause?: unknown } | undefined;
  while (root && typeof root === "object" && root.cause && typeof root.cause === "object") {
    root = root.cause as typeof root;
  }
  const code = root?.code;
  const message = String(root?.message ?? error).slice(0, 300);
  const hints: Record<string, string> = {
    "28P01":
      "PostgreSQL rejected the password. PostgreSQL only applies POSTGRES_PASSWORD when its data volume is first created, so the volume was probably initialised with a different password. Set the database password back to the original value, or remove the database volume (all data is lost) and redeploy.",
    "3D000": "The database in DATABASE_URL does not exist.",
    ENOTFOUND: "The database host in DATABASE_URL cannot be resolved. Check the host name (docker compose service name) and that both containers share a network.",
    EAI_AGAIN: "The database host in DATABASE_URL cannot be resolved yet (DNS). Check that the database container is running.",
    ECONNREFUSED: "The database is not accepting connections. Check that the database container is running and healthy.",
    ETIMEDOUT: "Connecting to the database timed out. Check the network between the app and the database.",
  };
  return { code, message, hint: code ? hints[code] : undefined };
}

async function isFreshDatabase(db: Database) {
  const result = await db.execute<{ exists: boolean }>(
    sql`select to_regclass('public.applications') is not null as "exists"`,
  );
  return !result.rows[0]?.exists;
}

async function runMigrations(handle: DbHandle) {
  const folder = migrationsFolder();
  if (handle.kind === "postgres") {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(handle.db, { migrationsFolder: folder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // The PGlite and node-postgres drizzle instances share the same query API.
    await migrate(handle.db as never, { migrationsFolder: folder });
  }
}

/** Shared, lazily initialised database handle (survives Next.js hot reloads). */
export async function getDb(): Promise<Database> {
  if (!globalThis.__horizonDb) {
    globalThis.__horizonDb = open({ autoSeed: true }).catch((error) => {
      globalThis.__horizonDb = undefined;
      throw error;
    });
  }
  return (await globalThis.__horizonDb).db;
}

/** Used by CLI scripts: opens a dedicated handle that can be closed afterwards. */
export async function openDatabase(options: { autoSeed?: boolean } = {}) {
  return open({ autoSeed: options.autoSeed ?? false });
}
