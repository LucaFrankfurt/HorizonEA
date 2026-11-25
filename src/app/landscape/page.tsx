import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LandscapeMap, type LandscapeData } from "@/components/landscape/landscape-map";
import { loadModel } from "@/lib/data/model";
import { eolStatus, techLabel } from "@/lib/risk";

export const metadata: Metadata = { title: "Landscape Map" };

export default async function LandscapePage() {
  const model = await loadModel();
  const domainSizes = new Map<string, number>();
  for (const a of model.applications) domainSizes.set(a.businessDomain, (domainSizes.get(a.businessDomain) ?? 0) + 1);
  const domains = [...domainSizes.keys()].sort((a, b) => domainSizes.get(b)! - domainSizes.get(a)! || a.localeCompare(b));

  const data: LandscapeData = {
    domains,
    apps: model.applications.map((a) => {
      const risk = model.risks.get(a.id)!;
      return {
        id: a.id,
        name: a.name,
        businessDomain: a.businessDomain,
        criticality: a.criticality,
        lifecycleStatus: a.lifecycleStatus,
        architectureState: a.architectureState,
        hostingModel: a.hostingModel,
        riskLevel: risk.level,
        riskScore: risk.score,
        delta: model.deltas.get(a.id)!,
        findings: risk.findings.slice(0, 4).map((f) => ({ severity: f.severity, message: f.message })),
      };
    }),
    interfaces: model.interfaces.map((i) => ({
      id: i.id,
      name: i.name,
      source: i.sourceApplicationId,
      target: i.targetApplicationId,
      protocol: i.protocol,
      pattern: i.integrationPattern,
      direction: i.direction,
      state: i.architectureState,
      dataFlow: i.dataFlow,
    })),
    technologies: model.technologies.map((t) => ({
      id: t.id,
      label: techLabel(t),
      category: t.category,
      eol: eolStatus(t.eolDate, model.today, t.extendedSupportEndDate),
      standard: t.standardizationStatus,
    })),
    assets: model.assets.map((a) => ({ id: a.id, name: a.name, type: a.assetType, environment: a.environment })),
    appTech: model.applicationTechnologies.map((l) => [l.applicationId, l.technologyId]),
    appAssets: model.applicationAssets.map((l) => [l.applicationId, l.assetId]),
  };

  return (
    <>
      <PageHeader
        title="Landscape map"
        description="Interactive dependency graph of applications, interfaces and their underlying technologies and IT assets."
      />
      <LandscapeMap data={data} />
    </>
  );
}
