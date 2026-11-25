import { addMonths } from "../dates";
import { eolStatus, highRiskDependencies, isOperational, techLabel, type RiskLevel } from "../risk";
import type { LoadedModel } from "./model";

export interface EolEntry {
  kind: "technology" | "asset" | "application";
  id: string;
  name: string;
  date: string;
  status: ReturnType<typeof eolStatus>;
  impactedApplications: number;
}

export interface RadarEntry {
  id: string;
  name: string;
  businessDomain: string;
  criticality: string;
  lifecycleStatus: string;
  level: RiskLevel;
  score: number;
  findings: { severity: string; message: string }[];
}

export function buildDashboard(model: LoadedModel) {
  const { today } = model;
  const in6 = addMonths(today, 6);
  const in12 = addMonths(today, 12);
  const operationalApps = model.applications.filter(isOperational);
  const operationalIds = new Set(operationalApps.map((a) => a.id));

  // Which operational applications depend on each technology (directly or via host OS) / asset.
  const appsByTech = new Map<string, Set<string>>();
  const appsByAsset = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, appId: string) => {
    if (!operationalIds.has(appId)) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(appId);
  };
  const assetById = new Map(model.assets.map((a) => [a.id, a]));
  for (const l of model.applicationTechnologies) add(appsByTech, l.technologyId, l.applicationId);
  for (const l of model.applicationAssets) {
    add(appsByAsset, l.assetId, l.applicationId);
    const os = assetById.get(l.assetId)?.operatingSystemId;
    if (os) add(appsByTech, os, l.applicationId);
  }

  const eolEntries: EolEntry[] = [];
  for (const t of model.technologies) {
    const impacted = appsByTech.get(t.id)?.size ?? 0;
    if (!t.eolDate) continue;
    eolEntries.push({
      kind: "technology",
      id: t.id,
      name: techLabel(t),
      date: t.eolDate,
      status: eolStatus(t.eolDate, today, t.extendedSupportEndDate),
      impactedApplications: impacted,
    });
  }
  for (const a of model.assets) {
    if (!a.eolDate) continue;
    eolEntries.push({
      kind: "asset",
      id: a.id,
      name: a.name,
      date: a.eolDate,
      status: eolStatus(a.eolDate, today),
      impactedApplications: appsByAsset.get(a.id)?.size ?? 0,
    });
  }
  for (const a of operationalApps) {
    if (!a.plannedEolDate) continue;
    eolEntries.push({
      kind: "application",
      id: a.id,
      name: a.name,
      date: a.plannedEolDate,
      status: eolStatus(a.plannedEolDate, today),
      impactedApplications: 1,
    });
  }
  eolEntries.sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = eolEntries.filter((e) => e.date >= today && e.date <= in12);
  const inUse = (e: EolEntry) => e.kind === "application" || e.impactedApplications > 0;
  const pastEolInUse = eolEntries.filter((e) => e.date < today && inUse(e) && e.kind !== "application");

  const dependencies = highRiskDependencies(model, model.risks);

  const radar: RadarEntry[] = operationalApps
    .map((app) => {
      const risk = model.risks.get(app.id)!;
      return {
        id: app.id,
        name: app.name,
        businessDomain: app.businessDomain,
        criticality: app.criticality,
        lifecycleStatus: app.lifecycleStatus,
        level: risk.level,
        score: risk.score,
        findings: risk.findings.map((f) => ({ severity: f.severity, message: f.message })),
      };
    })
    .filter((r) => r.level !== "none")
    .sort((a, b) => b.score - a.score);

  const count = <T,>(items: T[], key: (item: T) => string) =>
    items.reduce<Record<string, number>>((acc, item) => {
      const k = key(item);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  const inFlight = model.initiatives.filter((i) => i.status === "In Progress" || i.status === "Blocked");

  return {
    today,
    kpis: {
      activeApplications: model.applications.filter((a) => a.lifecycleStatus === "Active").length,
      phaseOutApplications: model.applications.filter((a) => a.lifecycleStatus === "Phase-Out").length,
      plannedApplications: model.applications.filter((a) => a.lifecycleStatus === "Planned").length,
      totalApplications: model.applications.length,
      eolWithin6: upcoming.filter((e) => e.date <= in6 && inUse(e)).length,
      eolWithin12: upcoming.filter((e) => inUse(e)).length,
      pastEolInUse: pastEolInUse.length,
      activeInitiatives: model.initiatives.filter((i) => i.status === "In Progress").length,
      blockedInitiatives: model.initiatives.filter((i) => i.status === "Blocked").length,
      inFlightBudget: inFlight.reduce((sum, i) => sum + (i.budget ?? 0), 0),
      highRiskDependencies: dependencies.length,
      criticalDependencies: dependencies.filter((d) => d.severity === "critical").length,
      applicationsAtRisk: radar.filter((r) => r.level === "critical" || r.level === "high").length,
    },
    upcomingEol: upcoming.filter(inUse),
    pastEolInUse,
    radar,
    dependencies,
    distributions: {
      lifecycle: count(model.applications, (a) => a.lifecycleStatus),
      standardization: count(model.technologies, (t) => t.standardizationStatus),
      initiativeStatus: count(model.initiatives, (i) => i.status),
      riskLevels: count(operationalApps, (a) => model.risks.get(a.id)?.level ?? "none"),
    },
  };
}

export type DashboardData = ReturnType<typeof buildDashboard>;
