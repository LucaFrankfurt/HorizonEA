import type { PgColumn, PgTableWithColumns } from "drizzle-orm/pg-core";
import type { z } from "zod";
import * as s from "../db/schema";
import {
  applicationAssetSchema,
  applicationSchema,
  applicationTechnologySchema,
  assetSchema,
  initiativeItemSchema,
  initiativePhaseSchema,
  initiativeSchema,
  interfaceSchema,
  technologySchema,
} from "../validation";

export interface ResourceDef {
  /** Key used for cross-field rules and import/export. */
  key: ResourceKey;
  /** URL segment under /api. */
  slug: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTableWithColumns<any>;
  schema: z.ZodObject;
  orderBy: PgColumn[];
  /** Natural key used to match rows during CSV/JSON import when no id is given. */
  naturalKey?: string[];
}

export type ResourceKey =
  | "application"
  | "technology"
  | "asset"
  | "interface"
  | "applicationTechnology"
  | "applicationAsset"
  | "initiative"
  | "initiativeItem"
  | "initiativePhase";

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  application: {
    key: "application",
    slug: "applications",
    label: "Applications",
    table: s.applications,
    schema: applicationSchema,
    orderBy: [s.applications.name],
    naturalKey: ["name"],
  },
  technology: {
    key: "technology",
    slug: "technologies",
    label: "Technologies",
    table: s.technologies,
    schema: technologySchema,
    orderBy: [s.technologies.category, s.technologies.name, s.technologies.version],
    naturalKey: ["name", "version"],
  },
  asset: {
    key: "asset",
    slug: "assets",
    label: "IT Assets",
    table: s.assets,
    schema: assetSchema,
    orderBy: [s.assets.name],
    naturalKey: ["name"],
  },
  interface: {
    key: "interface",
    slug: "interfaces",
    label: "Interfaces",
    table: s.interfaces,
    schema: interfaceSchema,
    orderBy: [s.interfaces.name],
    naturalKey: ["name", "sourceApplicationId", "targetApplicationId"],
  },
  applicationTechnology: {
    key: "applicationTechnology",
    slug: "application-technologies",
    label: "Application ↔ Technology",
    table: s.applicationTechnologies,
    schema: applicationTechnologySchema,
    orderBy: [s.applicationTechnologies.createdAt],
    naturalKey: ["applicationId", "technologyId"],
  },
  applicationAsset: {
    key: "applicationAsset",
    slug: "application-assets",
    label: "Application ↔ IT Asset",
    table: s.applicationAssets,
    schema: applicationAssetSchema,
    orderBy: [s.applicationAssets.createdAt],
    naturalKey: ["applicationId", "assetId"],
  },
  initiative: {
    key: "initiative",
    slug: "initiatives",
    label: "Initiatives",
    table: s.initiatives,
    schema: initiativeSchema,
    orderBy: [s.initiatives.name],
    naturalKey: ["name"],
  },
  initiativeItem: {
    key: "initiativeItem",
    slug: "initiative-items",
    label: "Initiative items (As-Is → To-Be)",
    table: s.initiativeItems,
    schema: initiativeItemSchema,
    orderBy: [s.initiativeItems.createdAt],
  },
  initiativePhase: {
    key: "initiativePhase",
    slug: "initiative-phases",
    label: "Initiative phases",
    table: s.initiativePhases,
    schema: initiativePhaseSchema,
    orderBy: [s.initiativePhases.initiativeId, s.initiativePhases.sortOrder],
    naturalKey: ["initiativeId", "name"],
  },
};

/** Insert order respecting foreign keys (reverse for deletes). */
export const IMPORT_ORDER: ResourceKey[] = [
  "technology",
  "asset",
  "application",
  "interface",
  "applicationTechnology",
  "applicationAsset",
  "initiative",
  "initiativeItem",
  "initiativePhase",
];
