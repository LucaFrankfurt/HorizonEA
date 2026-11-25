import { z } from "zod";
import { normalizeDate } from "./dates";
import {
  ARCHITECTURE_STATES,
  ASSET_TYPES,
  CRITICALITIES,
  ENVIRONMENTS,
  HOSTING_MODELS,
  INITIATIVE_STATUSES,
  INTEGRATION_PATTERNS,
  INTERFACE_DIRECTIONS,
  ITEM_KINDS,
  LIFECYCLE_STATUSES,
  MIGRATION_STRATEGIES,
  PHASE_STATUSES,
  RISK_LEVELS,
  STANDARDIZATION_STATUSES,
  TECH_CATEGORIES,
} from "./domain";

// ---------------------------------------------------------------------------
// Field helpers – lenient on input (CSV / forms), strict on output.
// ---------------------------------------------------------------------------
const blankToNull = (v: unknown) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v);
const squash = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

const requiredText = (max = 200) => z.string({ error: "Required" }).trim().min(1, "Required").max(max);
const optionalText = (max = 4000) => z.preprocess(blankToNull, z.string().trim().max(max).nullable());
const optionalDate = z.preprocess(
  (v) => normalizeDate(v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD").nullable(),
);
const optionalInt = z.preprocess(
  (v) => {
    const b = blankToNull(v);
    if (b === null) return null;
    if (typeof b === "string") return Number(b.replace(/[\s,_']/g, ""));
    return b;
  },
  z.number({ error: "Must be a number" }).int("Must be a whole number").min(0, "Must be ≥ 0").nullable(),
);
const id = z.guid("Must be a valid id");
const optionalId = z.preprocess(blankToNull, id.nullable());

/**
 * Enum that accepts case / punctuation variations, e.g. "tier1", "on premises", "AS-IS".
 * Blank values (empty CSV cells) count as "not supplied" so the default applies.
 */
function looseEnum<const T extends readonly [string, ...string[]]>(values: T, fallback?: T[number]) {
  const lookup = new Map(values.map((v) => [squash(v), v]));
  const inner = z.preprocess(
    (v) => (typeof v === "string" ? (lookup.get(squash(v)) ?? v.trim()) : v),
    z.enum(values, { error: () => `Must be one of: ${values.join(", ")}` }),
  );
  return z.preprocess((v) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v), fallback ? inner.default(fallback as never) : inner);
}

// ---------------------------------------------------------------------------
// Entity schemas (base objects; use `.partial()` for updates)
// ---------------------------------------------------------------------------
export const applicationSchema = z.object({
  name: requiredText(),
  description: optionalText(),
  businessDomain: requiredText(120),
  criticality: looseEnum(CRITICALITIES, "Tier 2"),
  owner: optionalText(200),
  lifecycleStatus: looseEnum(LIFECYCLE_STATUSES, "Active"),
  architectureState: looseEnum(ARCHITECTURE_STATES, "Both"),
  goLiveDate: optionalDate,
  plannedEolDate: optionalDate,
  hostingModel: looseEnum(HOSTING_MODELS, "On-Premises"),
});

export const technologySchema = z.object({
  name: requiredText(),
  category: looseEnum(TECH_CATEGORIES),
  version: z.preprocess((v) => (v === null || v === undefined ? "" : String(v).trim()), z.string().max(60)).default(""),
  vendor: optionalText(200),
  releaseDate: optionalDate,
  eolDate: optionalDate,
  extendedSupportEndDate: optionalDate,
  standardizationStatus: looseEnum(STANDARDIZATION_STATUSES, "Approved"),
  notes: optionalText(),
});

export const assetSchema = z.object({
  name: requiredText(),
  assetType: looseEnum(ASSET_TYPES),
  environment: looseEnum(ENVIRONMENTS, "Prod"),
  location: optionalText(200),
  operatingSystemId: optionalId,
  owner: optionalText(200),
  eolDate: optionalDate,
  description: optionalText(),
});

export const interfaceSchema = z.object({
  name: requiredText(),
  sourceApplicationId: id,
  targetApplicationId: id,
  dataFlow: optionalText(500),
  protocol: optionalText(120),
  integrationPattern: looseEnum(INTEGRATION_PATTERNS, "Synchronous API"),
  direction: looseEnum(INTERFACE_DIRECTIONS, "Unidirectional"),
  architectureState: looseEnum(ARCHITECTURE_STATES, "Both"),
  description: optionalText(),
});

export const applicationTechnologySchema = z.object({
  applicationId: id,
  technologyId: id,
  usage: optionalText(200),
});

export const applicationAssetSchema = z.object({
  applicationId: id,
  assetId: id,
  role: optionalText(200),
});

export const initiativeSchema = z.object({
  name: requiredText(),
  description: optionalText(),
  strategy: looseEnum(MIGRATION_STRATEGIES),
  status: looseEnum(INITIATIVE_STATUSES, "Backlog"),
  owner: optionalText(200),
  startDate: optionalDate,
  targetDate: optionalDate,
  budget: optionalInt,
  effortPersonDays: optionalInt,
  riskLevel: looseEnum(RISK_LEVELS, "Medium"),
  riskNotes: optionalText(),
});

export const initiativeItemSchema = z.object({
  initiativeId: id,
  kind: looseEnum(ITEM_KINDS),
  sourceApplicationId: optionalId,
  targetApplicationId: optionalId,
  sourceTechnologyId: optionalId,
  targetTechnologyId: optionalId,
  notes: optionalText(500),
});

export const initiativePhaseSchema = z.object({
  initiativeId: id,
  name: requiredText(),
  startDate: optionalDate,
  endDate: optionalDate,
  status: looseEnum(PHASE_STATUSES, "Planned"),
  sortOrder: z.preprocess((v) => (blankToNull(v) === null ? 0 : Number(v)), z.number().int()).default(0),
});

// ---------------------------------------------------------------------------
// Cross-field rules, evaluated on the merged record (create or update).
// ---------------------------------------------------------------------------
export type Issues = Record<string, string>;
type Rec = Record<string, unknown>;

const dateOrder = (rec: Rec, from: string, to: string, message: string): Issues =>
  rec[from] && rec[to] && String(rec[to]) < String(rec[from]) ? { [to]: message } : {};

export const crossRules: Record<string, (rec: Rec) => Issues> = {
  application: (r) => dateOrder(r, "goLiveDate", "plannedEolDate", "Planned EOL must be after the go-live date"),
  technology: (r) => ({
    ...dateOrder(r, "releaseDate", "eolDate", "EOL must be after the release date"),
    ...dateOrder(r, "eolDate", "extendedSupportEndDate", "Extended support must end after the official EOL"),
  }),
  asset: () => ({}),
  interface: (r): Issues =>
    r.sourceApplicationId && r.sourceApplicationId === r.targetApplicationId
      ? { targetApplicationId: "Source and target must be different applications" }
      : {},
  applicationTechnology: () => ({}),
  applicationAsset: () => ({}),
  initiative: (r) => dateOrder(r, "startDate", "targetDate", "Target completion must be after the start date"),
  initiativeItem: (r) => {
    const issues: Issues = {};
    if (r.kind === "Application") {
      if (!r.sourceApplicationId && !r.targetApplicationId)
        issues.sourceApplicationId = "Select a source and/or a target application";
      if (r.sourceTechnologyId || r.targetTechnologyId)
        issues.kind = "Application items cannot reference technologies";
    } else if (r.kind === "Technology") {
      if (!r.sourceTechnologyId && !r.targetTechnologyId)
        issues.sourceTechnologyId = "Select a source and/or a target technology";
      if (r.sourceApplicationId || r.targetApplicationId)
        issues.kind = "Technology items cannot reference applications";
    }
    return issues;
  },
  initiativePhase: (r) => dateOrder(r, "startDate", "endDate", "End date must be after the start date"),
};

/**
 * Validates a partial update. Zod 4 applies `.default()` (and our preprocessors)
 * even for absent keys inside `.partial()`, so the result is reduced to the keys
 * that were actually supplied – absent fields are never overwritten.
 */
export function parsePartial(schema: z.ZodObject, input: Record<string, unknown>) {
  const result = schema.partial().safeParse(input);
  if (!result.success) return result;
  const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  const data = Object.fromEntries(
    Object.entries(result.data as Record<string, unknown>).filter(
      // keep supplied keys; a blank value that resolved to a default (e.g. an empty enum cell) is treated as "not supplied"
      ([key, value]) => key in input && !(isBlank(input[key]) && value !== null),
    ),
  );
  return { success: true as const, data };
}

export function zodIssues(error: z.ZodError): Issues {
  const issues: Issues = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!issues[key]) issues[key] = issue.message;
  }
  return issues;
}
