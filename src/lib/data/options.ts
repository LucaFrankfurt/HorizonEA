import type { Option } from "@/components/forms/entity-form";
import type { Application, Asset, Technology } from "../db/schema";
import { techLabel } from "../risk";

export const applicationOptions = (apps: Application[]): Option[] =>
  apps.map((a) => ({ value: a.id, label: `${a.name}${a.architectureState !== "Both" ? ` (${a.architectureState})` : ""}`, group: a.businessDomain }))
    .sort((a, b) => (a.group ?? "").localeCompare(b.group ?? "") || a.label.localeCompare(b.label));

export const technologyOptions = (techs: Technology[]): Option[] =>
  techs.map((t) => ({ value: t.id, label: `${techLabel(t)} · ${t.standardizationStatus}`, group: t.category }))
    .sort((a, b) => (a.group ?? "").localeCompare(b.group ?? "") || a.label.localeCompare(b.label));

export const platformOptions = (techs: Technology[]): Option[] =>
  technologyOptions(techs.filter((t) => t.category === "Operating System" || t.category === "Infrastructure"));

export const assetOptions = (assets: Asset[]): Option[] =>
  assets.map((a) => ({ value: a.id, label: `${a.name} (${a.environment})`, group: a.assetType }))
    .sort((a, b) => (a.group ?? "").localeCompare(b.group ?? "") || a.label.localeCompare(b.label));
