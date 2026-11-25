import { addMonths, daysBetween, formatDate } from "./dates";
import type {
  Application,
  ApplicationAsset,
  ApplicationTechnology,
  Asset,
  Initiative,
  InitiativeItem,
  Interface,
  Technology,
} from "./db/schema";

// ---------------------------------------------------------------------------
// EOL status
// ---------------------------------------------------------------------------
export type EolStatus = "expired" | "extended" | "within6" | "within12" | "supported" | "unknown";

export const EOL_STATUS_META: Record<EolStatus, { label: string; tone: Tone; order: number }> = {
  expired: { label: "Past EOL", tone: "red", order: 0 },
  extended: { label: "Extended support", tone: "orange", order: 1 },
  within6: { label: "EOL < 6 months", tone: "amber", order: 2 },
  within12: { label: "EOL < 12 months", tone: "yellow", order: 3 },
  supported: { label: "Supported", tone: "green", order: 4 },
  unknown: { label: "No EOL date", tone: "gray", order: 5 },
};

export type Tone = "red" | "orange" | "amber" | "yellow" | "green" | "blue" | "violet" | "gray" | "teal";

export function eolStatus(
  eolDate: string | null | undefined,
  today: string,
  extendedSupportEndDate?: string | null,
): EolStatus {
  if (!eolDate) return "unknown";
  if (eolDate < today) {
    return extendedSupportEndDate && extendedSupportEndDate >= today ? "extended" : "expired";
  }
  if (eolDate <= addMonths(today, 6)) return "within6";
  if (eolDate <= addMonths(today, 12)) return "within12";
  return "supported";
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------
export type Severity = "critical" | "high" | "medium" | "low";
export type RiskLevel = Severity | "none";

export const SEVERITY_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 10, high: 5, medium: 2, low: 1 };
export const CRITICALITY_FACTOR: Record<string, number> = { "Tier 1": 3, "Tier 2": 2, "Tier 3": 1 };

export const RISK_META: Record<RiskLevel, { label: string; tone: Tone }> = {
  critical: { label: "Critical", tone: "red" },
  high: { label: "High", tone: "orange" },
  medium: { label: "Medium", tone: "amber" },
  low: { label: "Low", tone: "blue" },
  none: { label: "No risk", tone: "green" },
};

export interface RiskFinding {
  severity: Severity;
  kind: "technology" | "asset" | "application" | "interface";
  refId: string;
  refName: string;
  message: string;
  /** Relevant deadline, if any (used for sorting and the radar). */
  date?: string | null;
}

export interface ApplicationRisk {
  applicationId: string;
  level: RiskLevel;
  score: number;
  findings: RiskFinding[];
}

export const techLabel = (t: Pick<Technology, "name" | "version">) =>
  t.version && !t.name.includes(t.version) ? `${t.name} ${t.version}` : t.name;

/** Findings for a single technology, independent of who uses it. */
export function assessTechnology(tech: Technology, today: string): Omit<RiskFinding, "kind" | "refId" | "refName">[] {
  const findings: Omit<RiskFinding, "kind" | "refId" | "refName">[] = [];
  const label = techLabel(tech);
  const status = eolStatus(tech.eolDate, today, tech.extendedSupportEndDate);

  switch (status) {
    case "expired":
      findings.push({
        severity: "critical",
        message: `${label} reached end of life on ${formatDate(tech.eolDate)}${
          tech.extendedSupportEndDate ? ` (extended support ended ${formatDate(tech.extendedSupportEndDate)})` : ""
        }`,
        date: tech.eolDate,
      });
      break;
    case "extended":
      findings.push({
        severity: "high",
        message: `${label} is past standard support (${formatDate(tech.eolDate)}); paid extended support until ${formatDate(
          tech.extendedSupportEndDate,
        )}`,
        date: tech.extendedSupportEndDate,
      });
      break;
    case "within6":
      findings.push({
        severity: "high",
        message: `${label} reaches end of life in ${daysBetween(today, tech.eolDate!)} days (${formatDate(tech.eolDate)})`,
        date: tech.eolDate,
      });
      break;
    case "within12":
      findings.push({
        severity: "medium",
        message: `${label} reaches end of life within 12 months (${formatDate(tech.eolDate)})`,
        date: tech.eolDate,
      });
      break;
  }

  if (tech.standardizationStatus === "Prohibited") {
    findings.push({ severity: "critical", message: `${label} is a prohibited technology standard` });
  } else if (tech.standardizationStatus === "Sunset") {
    findings.push({ severity: "medium", message: `${label} is sunset – a migration plan is required` });
  } else if (tech.standardizationStatus === "Containment") {
    findings.push({ severity: "low", message: `${label} is in containment – no new usage allowed` });
  }
  return findings;
}

export function assessAsset(
  asset: Asset,
  os: Technology | undefined,
  today: string,
): Omit<RiskFinding, "kind" | "refId" | "refName">[] {
  const findings: Omit<RiskFinding, "kind" | "refId" | "refName">[] = [];
  const status = eolStatus(asset.eolDate, today);
  if (status === "expired") {
    findings.push({
      severity: "critical",
      message: `Asset ${asset.name} is past its end of support (${formatDate(asset.eolDate)})`,
      date: asset.eolDate,
    });
  } else if (status === "within6") {
    findings.push({
      severity: "high",
      message: `Asset ${asset.name} reaches end of support on ${formatDate(asset.eolDate)}`,
      date: asset.eolDate,
    });
  } else if (status === "within12") {
    findings.push({
      severity: "medium",
      message: `Asset ${asset.name} reaches end of support within 12 months (${formatDate(asset.eolDate)})`,
      date: asset.eolDate,
    });
  }
  if (os) {
    for (const f of assessTechnology(os, today)) {
      findings.push({ ...f, message: `Host ${asset.name}: ${f.message}` });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Portfolio assessment
// ---------------------------------------------------------------------------
export interface PortfolioModel {
  applications: Application[];
  technologies: Technology[];
  assets: Asset[];
  interfaces: Interface[];
  applicationTechnologies: ApplicationTechnology[];
  applicationAssets: ApplicationAsset[];
  initiatives: Initiative[];
  initiativeItems: InitiativeItem[];
}

export const isOperational = (app: Pick<Application, "lifecycleStatus">) =>
  app.lifecycleStatus === "Active" || app.lifecycleStatus === "Phase-Out";

const maxLevel = (findings: RiskFinding[]): RiskLevel =>
  findings.reduce<RiskLevel>((acc, f) => (SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[acc] ? f.severity : acc), "none");

/**
 * Evaluates every non-retired application against its technologies, hosting
 * assets, interface partners and governance rules. Pure function – no I/O.
 */
export function assessPortfolio(model: PortfolioModel, today: string): Map<string, ApplicationRisk> {
  const techById = new Map(model.technologies.map((t) => [t.id, t]));
  const assetById = new Map(model.assets.map((a) => [a.id, a]));
  const appById = new Map(model.applications.map((a) => [a.id, a]));
  const techFindings = new Map(model.technologies.map((t) => [t.id, assessTechnology(t, today)]));
  const assetFindings = new Map(
    model.assets.map((a) => [a.id, assessAsset(a, a.operatingSystemId ? techById.get(a.operatingSystemId) : undefined, today)]),
  );

  const activeInitiativeIds = new Set(model.initiatives.filter((i) => i.status !== "Completed").map((i) => i.id));
  const coveredApps = new Set(
    model.initiativeItems
      .filter((item) => activeInitiativeIds.has(item.initiativeId) && item.sourceApplicationId)
      .map((item) => item.sourceApplicationId!),
  );

  const result = new Map<string, ApplicationRisk>();
  for (const app of model.applications) {
    const findings: RiskFinding[] = [];
    if (app.lifecycleStatus !== "Retired") {
      for (const link of model.applicationTechnologies.filter((l) => l.applicationId === app.id)) {
        const tech = techById.get(link.technologyId);
        if (!tech) continue;
        for (const f of techFindings.get(tech.id) ?? []) {
          findings.push({ ...f, kind: "technology", refId: tech.id, refName: techLabel(tech) });
        }
      }
      for (const link of model.applicationAssets.filter((l) => l.applicationId === app.id)) {
        const asset = assetById.get(link.assetId);
        if (!asset) continue;
        for (const f of assetFindings.get(asset.id) ?? []) {
          findings.push({ ...f, kind: "asset", refId: asset.id, refName: asset.name });
        }
      }
      if (isOperational(app) && app.plannedEolDate && app.plannedEolDate < today) {
        findings.push({
          severity: "high",
          kind: "application",
          refId: app.id,
          refName: app.name,
          message: `Planned EOL (${formatDate(app.plannedEolDate)}) has passed but the application is still ${app.lifecycleStatus.toLowerCase()}`,
          date: app.plannedEolDate,
        });
      }
      if (app.lifecycleStatus === "Phase-Out" && !coveredApps.has(app.id)) {
        findings.push({
          severity: "medium",
          kind: "application",
          refId: app.id,
          refName: app.name,
          message: "Application is in Phase-Out but no active migration initiative covers it",
        });
      }
      for (const iface of model.interfaces) {
        if (iface.architectureState === "To-Be") continue;
        const partnerId =
          iface.sourceApplicationId === app.id
            ? iface.targetApplicationId
            : iface.targetApplicationId === app.id
              ? iface.sourceApplicationId
              : null;
        if (!partnerId) continue;
        const partner = appById.get(partnerId);
        if (!partner) continue;
        if (partner.lifecycleStatus === "Retired") {
          findings.push({
            severity: "high",
            kind: "interface",
            refId: iface.id,
            refName: iface.name,
            message: `Interface "${iface.name}" still points to retired application ${partner.name}`,
          });
        } else if (partner.lifecycleStatus === "Phase-Out" && app.lifecycleStatus === "Active") {
          findings.push({
            severity: "low",
            kind: "interface",
            refId: iface.id,
            refName: iface.name,
            message: `Interface "${iface.name}" depends on phase-out application ${partner.name}`,
            date: partner.plannedEolDate,
          });
        }
      }
    }

    findings.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
    const factor = CRITICALITY_FACTOR[app.criticality] ?? 1;
    const score = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0) * factor;
    result.set(app.id, { applicationId: app.id, level: maxLevel(findings), score, findings });
  }
  return result;
}

/** Dependencies (app→tech, app→asset, app→app) of operational apps whose worst finding is high or critical. */
export function highRiskDependencies(model: PortfolioModel, risks: Map<string, ApplicationRisk>) {
  const result: { applicationId: string; kind: RiskFinding["kind"]; refId: string; refName: string; severity: Severity }[] = [];
  const operational = new Set(model.applications.filter(isOperational).map((a) => a.id));
  for (const [appId, risk] of risks) {
    if (!operational.has(appId)) continue;
    const seen = new Map<string, Severity>();
    for (const f of risk.findings) {
      if (f.kind === "application") continue;
      if (f.severity !== "critical" && f.severity !== "high") continue;
      const key = `${f.kind}:${f.refId}`;
      const prev = seen.get(key);
      if (!prev || SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[prev]) seen.set(key, f.severity);
    }
    for (const [key, severity] of seen) {
      const [kind, refId] = key.split(":") as [RiskFinding["kind"], string];
      const f = risk.findings.find((x) => x.kind === kind && x.refId === refId)!;
      result.push({ applicationId: appId, kind, refId, refName: f.refName, severity });
    }
  }
  return result;
}
