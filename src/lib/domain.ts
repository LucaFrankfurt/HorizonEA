/**
 * Domain vocabulary shared by the database schema, API validation, UI and
 * CSV/JSON import. Values are stored verbatim (human readable) in PostgreSQL
 * enums so exported files are directly usable in spreadsheets and reports.
 */

export const CRITICALITIES = ["Tier 1", "Tier 2", "Tier 3"] as const;
export const LIFECYCLE_STATUSES = ["Planned", "Active", "Phase-Out", "Retired"] as const;
export const ARCHITECTURE_STATES = ["As-Is", "To-Be", "Both"] as const;
export const HOSTING_MODELS = ["On-Premises", "Cloud", "SaaS", "Hybrid"] as const;

export const TECH_CATEGORIES = [
  "Language",
  "Framework",
  "Database",
  "Operating System",
  "Middleware",
  "Infrastructure",
] as const;
export const STANDARDIZATION_STATUSES = ["Approved", "Containment", "Sunset", "Prohibited"] as const;

export const ASSET_TYPES = ["Server", "Cluster", "Cloud Account", "Network Device", "Storage"] as const;
export const ENVIRONMENTS = ["Prod", "Staging", "Dev"] as const;

export const INTEGRATION_PATTERNS = [
  "Synchronous API",
  "Asynchronous Messaging",
  "Event Streaming",
  "File Transfer",
  "Database Integration",
  "ETL / Batch",
] as const;
export const INTERFACE_DIRECTIONS = ["Unidirectional", "Bidirectional"] as const;

export const MIGRATION_STRATEGIES = ["Rehost", "Replatform", "Refactor", "Replace", "Retire", "Retain"] as const;
export const INITIATIVE_STATUSES = ["Backlog", "In Progress", "Blocked", "Completed"] as const;
export const PHASE_STATUSES = ["Planned", "In Progress", "Completed"] as const;
export const RISK_LEVELS = ["Low", "Medium", "High"] as const;
export const ITEM_KINDS = ["Application", "Technology"] as const;

export type Criticality = (typeof CRITICALITIES)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type ArchitectureState = (typeof ARCHITECTURE_STATES)[number];
export type HostingModel = (typeof HOSTING_MODELS)[number];
export type TechCategory = (typeof TECH_CATEGORIES)[number];
export type StandardizationStatus = (typeof STANDARDIZATION_STATUSES)[number];
export type AssetType = (typeof ASSET_TYPES)[number];
export type Environment = (typeof ENVIRONMENTS)[number];
export type IntegrationPattern = (typeof INTEGRATION_PATTERNS)[number];
export type InterfaceDirection = (typeof INTERFACE_DIRECTIONS)[number];
export type MigrationStrategy = (typeof MIGRATION_STRATEGIES)[number];
export type InitiativeStatus = (typeof INITIATIVE_STATUSES)[number];
export type PhaseStatus = (typeof PHASE_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type ItemKind = (typeof ITEM_KINDS)[number];

/** Short explanations used for tooltips and the README. */
export const STRATEGY_DESCRIPTIONS: Record<MigrationStrategy, string> = {
  Rehost: "Lift & shift to new infrastructure without code changes",
  Replatform: "Move to a new platform with minimal optimisation (e.g. managed DB, containers)",
  Refactor: "Re-architect / rewrite to cloud-native patterns",
  Replace: "Substitute with a different product (often SaaS)",
  Retire: "Decommission; capability no longer needed or consolidated",
  Retain: "Keep as-is for now; revisit later",
};

export const STANDARDIZATION_DESCRIPTIONS: Record<StandardizationStatus, string> = {
  Approved: "Preferred standard for new and existing solutions",
  Containment: "Allowed for existing solutions only; no new usage",
  Sunset: "Being phased out; migration plan required",
  Prohibited: "Must not be used; remediation required",
};
