import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { z } from "zod";
import { IMPORT_ORDER, RESOURCES, type ResourceKey } from "./api/resources";
import type { Database } from "./db/client";
import { clearDatabase } from "./db/seed";
import { techLabel } from "./risk";
import { crossRules, parsePartial, zodIssues, type Issues } from "./validation";

type Row = Record<string, unknown>;

export const SNAPSHOT_FORMAT = "horizon-ea";
export const SNAPSHOT_VERSION = 1;

/** Reference columns: the id column plus a human readable label column used in CSV files. */
const REFERENCES: Partial<Record<ResourceKey, { field: string; label: string; target: ResourceKey }[]>> = {
  asset: [{ field: "operatingSystemId", label: "operatingSystem", target: "technology" }],
  interface: [
    { field: "sourceApplicationId", label: "sourceApplication", target: "application" },
    { field: "targetApplicationId", label: "targetApplication", target: "application" },
  ],
  applicationTechnology: [
    { field: "applicationId", label: "application", target: "application" },
    { field: "technologyId", label: "technology", target: "technology" },
  ],
  applicationAsset: [
    { field: "applicationId", label: "application", target: "application" },
    { field: "assetId", label: "asset", target: "asset" },
  ],
  initiativeItem: [
    { field: "initiativeId", label: "initiative", target: "initiative" },
    { field: "sourceApplicationId", label: "sourceApplication", target: "application" },
    { field: "targetApplicationId", label: "targetApplication", target: "application" },
    { field: "sourceTechnologyId", label: "sourceTechnology", target: "technology" },
    { field: "targetTechnologyId", label: "targetTechnology", target: "technology" },
  ],
  initiativePhase: [{ field: "initiativeId", label: "initiative", target: "initiative" }],
};

const LABELLED: ResourceKey[] = ["application", "technology", "asset", "initiative"];

function rowLabel(key: ResourceKey, row: Row): string {
  if (key === "technology") return techLabel({ name: String(row.name ?? ""), version: String(row.version ?? "") });
  return String(row.name ?? "");
}

export function resourceBySlug(slug: string) {
  return Object.values(RESOURCES).find((r) => r.slug === slug);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
async function loadAll(db: Database) {
  const all = {} as Record<ResourceKey, Row[]>;
  for (const key of IMPORT_ORDER) {
    const r = RESOURCES[key];
    all[key] = (await db
      .select()
      .from(r.table)
      .orderBy(...r.orderBy)) as Row[];
  }
  return all;
}

export async function exportSnapshot(db: Database) {
  const all = await loadAll(db);
  const data: Record<string, Row[]> = {};
  for (const key of IMPORT_ORDER) data[RESOURCES[key].slug] = all[key];
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Flat rows for one resource including human readable reference labels (for CSV / reporting). */
export async function exportRows(db: Database, key: ResourceKey) {
  const all = await loadAll(db);
  const labels = new Map<string, string>();
  for (const k of LABELLED) for (const row of all[k]) labels.set(String(row.id), rowLabel(k, row));

  const fields = ["id", ...Object.keys(RESOURCES[key].schema.shape)];
  const refs = REFERENCES[key] ?? [];
  const columns = csvColumns(key);
  const rows = all[key].map((row) => {
    const out: Row = {};
    for (const f of fields) {
      out[f] = row[f] ?? "";
      const ref = refs.find((r) => r.field === f);
      if (ref) out[ref.label] = row[f] ? (labels.get(String(row[f])) ?? "") : "";
    }
    return out;
  });
  return { columns, rows };
}

/** CSV columns for a collection: id, fields, and a readable label column after each reference id. */
export function csvColumns(key: ResourceKey) {
  const refs = REFERENCES[key] ?? [];
  const columns: string[] = [];
  for (const f of ["id", ...Object.keys(RESOURCES[key].schema.shape)]) {
    columns.push(f);
    const ref = refs.find((r) => r.field === f);
    if (ref) columns.push(ref.label);
  }
  return columns;
}

export function toCsv(columns: string[], rows: Row[]) {
  return Papa.unparse({ fields: columns, data: rows.map((r) => columns.map((c) => r[c] ?? "")) });
}

export function parseCsv(text: string): Row[] {
  const result = Papa.parse<Row>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (result.errors.length && !result.data.length) {
    throw new Error(`CSV could not be parsed: ${result.errors[0].message}`);
  }
  return result.data;
}

/** Accepts a full snapshot, or an object keyed by resource slug / key. */
export function normalizePayload(input: unknown): Partial<Record<ResourceKey, Row[]>> {
  if (!input || typeof input !== "object") throw new Error("Import file must contain a JSON object");
  const obj = input as Row;
  const data = (obj.format === SNAPSHOT_FORMAT && obj.data && typeof obj.data === "object" ? obj.data : obj) as Row;
  const out: Partial<Record<ResourceKey, Row[]>> = {};
  for (const [k, value] of Object.entries(data)) {
    const resource = resourceBySlug(k) ?? (k in RESOURCES ? RESOURCES[k as ResourceKey] : undefined);
    if (!resource) continue;
    if (!Array.isArray(value)) throw new Error(`"${k}" must be an array of records`);
    out[resource.key] = value as Row[];
  }
  if (!Object.keys(out).length) {
    throw new Error(`No known collections found. Expected keys such as: ${IMPORT_ORDER.map((k) => RESOURCES[k].slug).join(", ")}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------
export interface ImportReport {
  mode: "merge" | "replace";
  dryRun: boolean;
  applied: boolean;
  summary: Partial<Record<ResourceKey, { created: number; updated: number }>>;
  errors: { resource: string; row: number; issues: Issues }[];
}

const guid = z.guid();
const isGuid = (v: unknown) => typeof v === "string" && guid.safeParse(v).success;
const squashLabel = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

interface Op {
  key: ResourceKey;
  type: "insert" | "update";
  id: string;
  data: Row;
}

/**
 * Validates and applies an import. All-or-nothing: if any row fails
 * validation, nothing is written and the report lists every problem.
 * - merge:   rows are matched by `id`, then by natural key (e.g. name); matches are updated, others created.
 * - replace: all existing data is removed first.
 */
export async function importData(
  db: Database,
  payload: Partial<Record<ResourceKey, Row[]>>,
  options: { mode: "merge" | "replace"; dryRun?: boolean },
): Promise<ImportReport> {
  const report: ImportReport = { mode: options.mode, dryRun: !!options.dryRun, applied: false, summary: {}, errors: [] };
  const existing = options.mode === "merge" ? await loadAll(db) : ({} as Record<ResourceKey, Row[]>);

  // State that evolves as rows are processed (so later collections can reference earlier ones).
  const records = new Map<ResourceKey, Map<string, Row>>();
  const labelIndex = new Map<ResourceKey, Map<string, string[]>>();
  const idMap = new Map<string, string>(); // imported id → effective id
  const indexLabel = (key: ResourceKey, id: string, row: Row) => {
    if (!LABELLED.includes(key)) return;
    const idx = labelIndex.get(key) ?? new Map<string, string[]>();
    labelIndex.set(key, idx);
    const labels = new Set([squashLabel(rowLabel(key, row))]);
    if (key === "technology") labels.add(squashLabel(String(row.name ?? "")));
    for (const l of labels) idx.set(l, [...new Set([...(idx.get(l) ?? []), id])]);
  };
  for (const key of IMPORT_ORDER) {
    const map = new Map<string, Row>();
    for (const row of existing[key] ?? []) {
      map.set(String(row.id), row);
      indexLabel(key, String(row.id), row);
    }
    records.set(key, map);
  }

  const naturalKeyOf = (key: ResourceKey, row: Row) => {
    const nk = RESOURCES[key].naturalKey;
    return nk ? nk.map((f) => String(row[f] ?? "").trim().toLowerCase()).join("\u0000") : null;
  };

  const ops: Op[] = [];
  for (const key of IMPORT_ORDER) {
    const rows = payload[key];
    if (!rows?.length) continue;
    const resource = RESOURCES[key];
    const known = records.get(key)!;
    const byNaturalKey = new Map<string, string>();
    for (const [id, row] of known) {
      const nk = naturalKeyOf(key, row);
      if (nk) byNaturalKey.set(nk, id);
    }
    const stats = { created: 0, updated: 0 };

    rows.forEach((raw, index) => {
      const rowNo = index + 1;
      if (!raw || typeof raw !== "object") {
        report.errors.push({ resource: resource.slug, row: rowNo, issues: { _: "Record must be an object" } });
        return;
      }
      const input: Row = {};
      for (const field of Object.keys(resource.schema.shape)) if (field in raw) input[field] = raw[field];

      // Resolve references: id (mapped) or human readable label.
      const issues: Issues = {};
      for (const ref of REFERENCES[key] ?? []) {
        const rawId = raw[ref.field];
        const label = raw[ref.label];
        let resolved: string | null | undefined;
        if (rawId !== undefined && rawId !== null && String(rawId).trim() !== "") {
          const mapped = idMap.get(String(rawId).trim()) ?? String(rawId).trim();
          if (!records.get(ref.target)!.has(mapped)) issues[ref.field] = `Unknown ${ref.target} id "${rawId}"`;
          resolved = mapped;
        } else if (typeof label === "string" && label.trim() !== "") {
          const matches = labelIndex.get(ref.target)?.get(squashLabel(label)) ?? [];
          if (matches.length === 1) resolved = matches[0];
          else issues[ref.label] = matches.length ? `"${label}" is ambiguous` : `Unknown ${ref.target} "${label}"`;
        } else if (ref.field in raw || ref.label in raw) {
          resolved = null;
        }
        if (resolved !== undefined) input[ref.field] = resolved;
      }

      // Determine whether this row updates an existing record.
      // Match by id first, then by natural key (e.g. application name). Matched rows
      // are validated as partial updates so columns missing from the file are kept.
      const importedId = isGuid(raw.id) ? String(raw.id) : null;
      let targetId: string | null = importedId && known.has(importedId) ? importedId : null;
      if (!targetId) {
        const nk = naturalKeyOf(key, { version: "", ...input });
        targetId = (nk && byNaturalKey.get(nk)) || null;
      }
      const existingRow = targetId ? known.get(targetId) : undefined;

      const parsed = existingRow ? parsePartial(resource.schema, input) : resource.schema.safeParse(input);
      if (!parsed.success) {
        const zIssues = zodIssues(parsed.error);
        // An unresolvable label already explains why the id is missing.
        for (const ref of REFERENCES[key] ?? []) if (issues[ref.label]) delete zIssues[ref.field];
        Object.assign(issues, zIssues);
      }
      const data = (parsed.success ? parsed.data : {}) as Row;
      if (parsed.success) Object.assign(issues, crossRules[key]({ ...(existingRow ?? {}), ...data }));
      if (Object.keys(issues).length) {
        report.errors.push({ resource: resource.slug, row: rowNo, issues });
        return;
      }

      const id = targetId ?? importedId ?? crypto.randomUUID();
      if (importedId) idMap.set(importedId, id);
      const merged = { ...(existingRow ?? {}), ...data, id };
      if (existingRow) {
        if (ops.some((o) => o.id === id && o.type === "insert")) {
          // Same record twice in one file: fold into the pending insert.
          const pending = ops.find((o) => o.id === id && o.type === "insert")!;
          pending.data = { ...pending.data, ...data };
        } else {
          ops.push({ key, type: "update", id, data });
          stats.updated++;
        }
      } else {
        ops.push({ key, type: "insert", id, data: { ...data, id } });
        stats.created++;
      }
      known.set(id, merged);
      const nk = naturalKeyOf(key, merged);
      if (nk) byNaturalKey.set(nk, id);
      indexLabel(key, id, merged);
    });
    report.summary[key] = stats;
  }

  if (report.errors.length || options.dryRun) return report;

  await db.transaction(async (tx) => {
    if (options.mode === "replace") await clearDatabase(tx as unknown as Database);
    for (const key of IMPORT_ORDER) {
      const table = RESOURCES[key].table;
      const inserts = ops.filter((o) => o.key === key && o.type === "insert").map((o) => o.data);
      for (let i = 0; i < inserts.length; i += 500) {
        await tx.insert(table).values(inserts.slice(i, i + 500));
      }
      for (const op of ops.filter((o) => o.key === key && o.type === "update")) {
        await tx.update(table).set(op.data).where(eq(table.id, op.id));
      }
    }
  });
  report.applied = true;
  return report;
}
