import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { count } from "drizzle-orm";

process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;

const { openDatabase } = await import("../src/lib/db/client");
const { seedDatabase } = await import("../src/lib/db/seed");
const schema = await import("../src/lib/db/schema");
const io = await import("../src/lib/import-export");

describe("import / export (embedded PostgreSQL)", () => {
  let handle: Awaited<ReturnType<typeof openDatabase>>;

  before(async () => {
    handle = await openDatabase();
    await seedDatabase(handle.db);
  });
  after(async () => {
    await handle.close();
  });

  it("round-trips a full JSON snapshot in replace mode", async () => {
    const snapshot = await io.exportSnapshot(handle.db);
    const report = await io.importData(handle.db, io.normalizePayload(JSON.parse(JSON.stringify(snapshot))), { mode: "replace" });
    assert.equal(report.errors.length, 0);
    assert.equal(report.applied, true);
    const [{ value }] = await handle.db.select({ value: count() }).from(schema.interfaces);
    assert.equal(value, snapshot.data.interfaces.length);
  });

  it("merges CSV rows by natural key and resolves references by name", async () => {
    const csv = [
      "name,sourceApplication,targetApplication,protocol,integrationPattern,architectureState",
      "Customer APIs,Customer Portal,API Gateway,REST/HTTPS v2,synchronous api,both",
      "Brand new flow,power bi,ServiceNow ITSM,REST,,to-be",
    ].join("\n");
    const report = await io.importData(handle.db, { interface: io.parseCsv(csv) }, { mode: "merge" });
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.summary.interface, { created: 1, updated: 1 });
    const rows = await handle.db.select().from(schema.interfaces);
    const updated = rows.find((r) => r.name === "Customer APIs")!;
    assert.equal(updated.protocol, "REST/HTTPS v2");
    assert.ok(updated.dataFlow, "columns missing from the CSV are kept");
    assert.equal(rows.find((r) => r.name === "Brand new flow")!.integrationPattern, "Synchronous API");
  });

  it("is all-or-nothing and reports row level errors", async () => {
    const before = await handle.db.select({ value: count() }).from(schema.applications);
    const csv = "name,businessDomain,criticality\nGood App,Sales,Tier 1\nBad App,,Tier 7\n";
    const report = await io.importData(handle.db, { application: io.parseCsv(csv) }, { mode: "merge" });
    assert.equal(report.applied, false);
    assert.equal(report.errors.length, 1);
    assert.equal(report.errors[0].row, 2);
    assert.ok(report.errors[0].issues.businessDomain && report.errors[0].issues.criticality);
    const afterCount = await handle.db.select({ value: count() }).from(schema.applications);
    assert.deepEqual(afterCount, before);
  });

  it("dry runs never write", async () => {
    const report = await io.importData(handle.db, { technology: [{ name: "Zig", version: "0.14", category: "language" }] }, { mode: "merge", dryRun: true });
    assert.equal(report.applied, false);
    assert.deepEqual(report.summary.technology, { created: 1, updated: 0 });
    const rows = await handle.db.select().from(schema.technologies);
    assert.equal(rows.some((t) => t.name === "Zig"), false);
  });

  it("exports CSV with readable reference columns", async () => {
    const { columns, rows } = await io.exportRows(handle.db, "applicationTechnology");
    assert.deepEqual(columns, ["id", "applicationId", "application", "technologyId", "technology", "usage"]);
    assert.ok(rows.every((r) => r.application && r.technology));
    const csv = io.toCsv(columns, rows);
    assert.equal(io.parseCsv(csv).length, rows.length);
  });
});
