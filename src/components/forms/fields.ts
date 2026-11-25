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
  STRATEGY_DESCRIPTIONS,
  TECH_CATEGORIES,
} from "@/lib/domain";
import type { FieldDef, Option } from "./entity-form";

export const opts = (values: readonly string[]): Option[] => values.map((v) => ({ value: v, label: v }));

export function applicationFields(domains: string[]): FieldDef[] {
  return [
    { name: "name", label: "Name", required: true, full: true },
    { name: "businessDomain", label: "Business domain", required: true, suggestions: domains },
    { name: "owner", label: "Owner / team" },
    { name: "criticality", label: "Business criticality", type: "select", options: opts(CRITICALITIES) },
    { name: "lifecycleStatus", label: "Lifecycle status", type: "select", options: opts(LIFECYCLE_STATUSES) },
    {
      name: "architectureState",
      label: "Architecture state",
      type: "select",
      options: opts(ARCHITECTURE_STATES),
      help: "As-Is = current only, To-Be = target only, Both = stays",
    },
    { name: "hostingModel", label: "Hosting model", type: "select", options: opts(HOSTING_MODELS) },
    { name: "goLiveDate", label: "Go-live date", type: "date" },
    { name: "plannedEolDate", label: "Planned EOL date", type: "date" },
    { name: "description", label: "Description", type: "textarea" },
  ];
}

export function technologyFields(vendors: string[]): FieldDef[] {
  return [
    { name: "name", label: "Name", required: true, placeholder: "e.g. PostgreSQL" },
    { name: "version", label: "Version", placeholder: "e.g. 17" },
    { name: "category", label: "Category", type: "select", options: opts(TECH_CATEGORIES) },
    { name: "vendor", label: "Vendor", suggestions: vendors },
    {
      name: "standardizationStatus",
      label: "Standardization status",
      type: "select",
      options: opts(STANDARDIZATION_STATUSES),
    },
    { name: "releaseDate", label: "Release date", type: "date" },
    { name: "eolDate", label: "Official EOL date", type: "date", help: "End of standard / mainstream support" },
    { name: "extendedSupportEndDate", label: "Extended support end", type: "date", help: "Paid extended / ESU support" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function assetFields(platforms: Option[], locations: string[], owners: string[]): FieldDef[] {
  return [
    { name: "name", label: "Name", required: true, full: true },
    { name: "assetType", label: "Asset type", type: "select", options: opts(ASSET_TYPES) },
    { name: "environment", label: "Environment", type: "select", options: opts(ENVIRONMENTS) },
    { name: "location", label: "Location / region", suggestions: locations },
    { name: "owner", label: "Owner", suggestions: owners },
    {
      name: "operatingSystemId",
      label: "Operating system / platform",
      type: "select",
      options: platforms,
      allowEmpty: true,
      help: "Links the asset to the technology catalog for EOL tracking",
    },
    { name: "eolDate", label: "Hardware / contract end of support", type: "date" },
    { name: "description", label: "Description", type: "textarea" },
  ];
}

export function interfaceFields(apps: Option[], fixed?: { source?: boolean; target?: boolean }): FieldDef[] {
  return [
    { name: "name", label: "Interface name", required: true, full: true },
    ...(!fixed?.source
      ? [{ name: "sourceApplicationId", label: "Source (provider)", type: "select", options: apps, required: true } as FieldDef]
      : []),
    ...(!fixed?.target
      ? [{ name: "targetApplicationId", label: "Target (consumer)", type: "select", options: apps, required: true } as FieldDef]
      : []),
    { name: "integrationPattern", label: "Integration pattern", type: "select", options: opts(INTEGRATION_PATTERNS) },
    { name: "protocol", label: "Protocol / technology", placeholder: "e.g. REST/HTTPS, Kafka, SFTP" },
    { name: "direction", label: "Direction", type: "select", options: opts(INTERFACE_DIRECTIONS) },
    { name: "architectureState", label: "Architecture state", type: "select", options: opts(ARCHITECTURE_STATES) },
    { name: "dataFlow", label: "Data flow / business objects", full: true, placeholder: "e.g. Sales orders, invoices" },
    { name: "description", label: "Description", type: "textarea" },
  ];
}

export function initiativeFields(): FieldDef[] {
  return [
    { name: "name", label: "Name", required: true, full: true },
    {
      name: "strategy",
      label: "Migration strategy",
      type: "select",
      options: MIGRATION_STRATEGIES.map((s) => ({ value: s, label: `${s} – ${STRATEGY_DESCRIPTIONS[s]}` })),
    },
    { name: "status", label: "Status", type: "select", options: opts(INITIATIVE_STATUSES) },
    { name: "owner", label: "Owner" },
    { name: "riskLevel", label: "Risk level", type: "select", options: opts(RISK_LEVELS) },
    { name: "startDate", label: "Start date", type: "date" },
    { name: "targetDate", label: "Target completion", type: "date" },
    { name: "budget", label: "Budget", type: "number", placeholder: "e.g. 250000" },
    { name: "effortPersonDays", label: "Effort (person-days)", type: "number" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "riskNotes", label: "Risk notes", type: "textarea" },
  ];
}

export function phaseFields(): FieldDef[] {
  return [
    { name: "name", label: "Phase / milestone", required: true, full: true },
    { name: "startDate", label: "Start", type: "date" },
    { name: "endDate", label: "End", type: "date" },
    { name: "status", label: "Status", type: "select", options: opts(PHASE_STATUSES) },
    { name: "sortOrder", label: "Order", type: "number" },
  ];
}

export function itemFields(apps: Option[], techs: Option[]): FieldDef[] {
  const isApp = (v: Record<string, string>) => v.kind === "Application";
  const isTech = (v: Record<string, string>) => v.kind === "Technology";
  return [
    { name: "kind", label: "Item type", type: "select", options: opts(ITEM_KINDS), full: true },
    { name: "sourceApplicationId", label: "Source (As-Is) application", type: "select", options: apps, allowEmpty: true, visible: isApp },
    { name: "targetApplicationId", label: "Target (To-Be) application", type: "select", options: apps, allowEmpty: true, visible: isApp },
    { name: "sourceTechnologyId", label: "Source (As-Is) technology", type: "select", options: techs, allowEmpty: true, visible: isTech },
    { name: "targetTechnologyId", label: "Target (To-Be) technology", type: "select", options: techs, allowEmpty: true, visible: isTech },
    { name: "notes", label: "Notes", full: true },
  ];
}

export function appTechFields(techs: Option[]): FieldDef[] {
  return [
    { name: "technologyId", label: "Technology", type: "select", options: techs, required: true, full: true },
    { name: "usage", label: "Usage", placeholder: "e.g. Primary database", full: true },
  ];
}

export function appAssetFields(assets: Option[]): FieldDef[] {
  return [
    { name: "assetId", label: "IT asset", type: "select", options: assets, required: true, full: true },
    { name: "role", label: "Role", placeholder: "e.g. Application server", full: true },
  ];
}
