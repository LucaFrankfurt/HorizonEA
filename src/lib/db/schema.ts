import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
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
} from "../domain";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const criticalityEnum = pgEnum("criticality", CRITICALITIES);
export const lifecycleStatusEnum = pgEnum("lifecycle_status", LIFECYCLE_STATUSES);
export const architectureStateEnum = pgEnum("architecture_state", ARCHITECTURE_STATES);
export const hostingModelEnum = pgEnum("hosting_model", HOSTING_MODELS);
export const techCategoryEnum = pgEnum("tech_category", TECH_CATEGORIES);
export const standardizationStatusEnum = pgEnum("standardization_status", STANDARDIZATION_STATUSES);
export const assetTypeEnum = pgEnum("asset_type", ASSET_TYPES);
export const environmentEnum = pgEnum("environment", ENVIRONMENTS);
export const integrationPatternEnum = pgEnum("integration_pattern", INTEGRATION_PATTERNS);
export const interfaceDirectionEnum = pgEnum("interface_direction", INTERFACE_DIRECTIONS);
export const migrationStrategyEnum = pgEnum("migration_strategy", MIGRATION_STRATEGIES);
export const initiativeStatusEnum = pgEnum("initiative_status", INITIATIVE_STATUSES);
export const phaseStatusEnum = pgEnum("phase_status", PHASE_STATUSES);
export const riskLevelEnum = pgEnum("risk_level", RISK_LEVELS);
export const itemKindEnum = pgEnum("item_kind", ITEM_KINDS);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    businessDomain: text("business_domain").notNull(),
    criticality: criticalityEnum("criticality").notNull().default("Tier 2"),
    owner: text("owner"),
    lifecycleStatus: lifecycleStatusEnum("lifecycle_status").notNull().default("Active"),
    architectureState: architectureStateEnum("architecture_state").notNull().default("Both"),
    goLiveDate: date("go_live_date", { mode: "string" }),
    plannedEolDate: date("planned_eol_date", { mode: "string" }),
    hostingModel: hostingModelEnum("hosting_model").notNull().default("On-Premises"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("applications_name_uq").on(t.name),
    index("applications_domain_idx").on(t.businessDomain),
  ],
);

export const technologies = pgTable(
  "technologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: techCategoryEnum("category").notNull(),
    version: text("version").notNull().default(""),
    vendor: text("vendor"),
    releaseDate: date("release_date", { mode: "string" }),
    eolDate: date("eol_date", { mode: "string" }),
    extendedSupportEndDate: date("extended_support_end_date", { mode: "string" }),
    standardizationStatus: standardizationStatusEnum("standardization_status").notNull().default("Approved"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [uniqueIndex("technologies_name_version_uq").on(t.name, t.version)],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    assetType: assetTypeEnum("asset_type").notNull(),
    environment: environmentEnum("environment").notNull().default("Prod"),
    location: text("location"),
    /** Operating system / platform the asset runs – a reference into the technology catalog. */
    operatingSystemId: uuid("operating_system_id").references(() => technologies.id, { onDelete: "set null" }),
    owner: text("owner"),
    /** Hardware / contract end of support. */
    eolDate: date("eol_date", { mode: "string" }),
    description: text("description"),
    ...timestamps,
  },
  (t) => [uniqueIndex("assets_name_uq").on(t.name)],
);

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------
export const interfaces = pgTable(
  "interfaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    sourceApplicationId: uuid("source_application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    targetApplicationId: uuid("target_application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    dataFlow: text("data_flow"),
    protocol: text("protocol"),
    integrationPattern: integrationPatternEnum("integration_pattern").notNull().default("Synchronous API"),
    direction: interfaceDirectionEnum("direction").notNull().default("Unidirectional"),
    architectureState: architectureStateEnum("architecture_state").notNull().default("Both"),
    description: text("description"),
    ...timestamps,
  },
  (t) => [
    index("interfaces_source_idx").on(t.sourceApplicationId),
    index("interfaces_target_idx").on(t.targetApplicationId),
    check("interfaces_no_self_loop", sql`${t.sourceApplicationId} <> ${t.targetApplicationId}`),
  ],
);

export const applicationTechnologies = pgTable(
  "application_technologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    technologyId: uuid("technology_id")
      .notNull()
      .references(() => technologies.id, { onDelete: "cascade" }),
    usage: text("usage"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("application_technologies_uq").on(t.applicationId, t.technologyId),
    index("application_technologies_tech_idx").on(t.technologyId),
  ],
);

export const applicationAssets = pgTable(
  "application_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    role: text("role"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("application_assets_uq").on(t.applicationId, t.assetId),
    index("application_assets_asset_idx").on(t.assetId),
  ],
);

// ---------------------------------------------------------------------------
// Transformations
// ---------------------------------------------------------------------------
export const initiatives = pgTable(
  "initiatives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    strategy: migrationStrategyEnum("strategy").notNull(),
    status: initiativeStatusEnum("status").notNull().default("Backlog"),
    owner: text("owner"),
    startDate: date("start_date", { mode: "string" }),
    targetDate: date("target_date", { mode: "string" }),
    /** Budget in whole currency units. */
    budget: integer("budget"),
    effortPersonDays: integer("effort_person_days"),
    riskLevel: riskLevelEnum("risk_level").notNull().default("Medium"),
    riskNotes: text("risk_notes"),
    ...timestamps,
  },
  (t) => [uniqueIndex("initiatives_name_uq").on(t.name)],
);

/**
 * Links an As-Is source (application or technology) to its To-Be target.
 * Either side may be empty: a retirement has no target, a greenfield build has no source.
 */
export const initiativeItems = pgTable(
  "initiative_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    kind: itemKindEnum("kind").notNull(),
    sourceApplicationId: uuid("source_application_id").references(() => applications.id, { onDelete: "cascade" }),
    targetApplicationId: uuid("target_application_id").references(() => applications.id, { onDelete: "cascade" }),
    sourceTechnologyId: uuid("source_technology_id").references(() => technologies.id, { onDelete: "cascade" }),
    targetTechnologyId: uuid("target_technology_id").references(() => technologies.id, { onDelete: "cascade" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("initiative_items_initiative_idx").on(t.initiativeId)],
);

export const initiativePhases = pgTable(
  "initiative_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    status: phaseStatusEnum("status").notNull().default("Planned"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("initiative_phases_initiative_idx").on(t.initiativeId)],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Technology = typeof technologies.$inferSelect;
export type NewTechnology = typeof technologies.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Interface = typeof interfaces.$inferSelect;
export type NewInterface = typeof interfaces.$inferInsert;
export type ApplicationTechnology = typeof applicationTechnologies.$inferSelect;
export type ApplicationAsset = typeof applicationAssets.$inferSelect;
export type Initiative = typeof initiatives.$inferSelect;
export type NewInitiative = typeof initiatives.$inferInsert;
export type InitiativeItem = typeof initiativeItems.$inferSelect;
export type InitiativePhase = typeof initiativePhases.$inferSelect;
