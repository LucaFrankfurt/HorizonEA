import type { Metadata } from "next";
import { PageHeader, SubNav } from "@/components/layout/page-header";
import { LifecycleTimeline, type LifecycleItem } from "@/components/technologies/lifecycle-timeline";
import { TECH_TABS } from "@/components/technologies/tabs";
import { loadModel } from "@/lib/data/model";
import { isOperational, techLabel } from "@/lib/risk";

export const metadata: Metadata = { title: "Lifecycle timeline" };

export default async function TimelinePage() {
  const model = await loadModel();
  const operational = new Set(model.applications.filter(isOperational).map((a) => a.id));
  const techInUse = new Set<string>();
  for (const l of model.applicationTechnologies) if (operational.has(l.applicationId)) techInUse.add(l.technologyId);
  const assetInUse = new Set(model.applicationAssets.filter((l) => operational.has(l.applicationId)).map((l) => l.assetId));
  for (const a of model.assets) if (assetInUse.has(a.id) && a.operatingSystemId) techInUse.add(a.operatingSystemId);

  const items: LifecycleItem[] = [
    ...model.technologies.map((t) => ({
      id: t.id,
      kind: "Technology" as const,
      label: techLabel(t),
      sublabel: `${t.category} · ${t.standardizationStatus}`,
      category: t.category,
      start: t.releaseDate,
      eol: t.eolDate,
      extended: t.extendedSupportEndDate,
      inUse: techInUse.has(t.id),
    })),
    ...model.applications.map((a) => ({
      id: a.id,
      kind: "Application" as const,
      label: a.name,
      sublabel: `${a.businessDomain} · ${a.lifecycleStatus}`,
      start: a.goLiveDate,
      eol: a.plannedEolDate,
      extended: null,
      inUse: a.lifecycleStatus !== "Retired",
      lifecycleStatus: a.lifecycleStatus,
    })),
    ...model.assets.map((a) => ({
      id: a.id,
      kind: "Asset" as const,
      label: a.name,
      sublabel: `${a.assetType} · ${a.environment}`,
      start: null,
      eol: a.eolDate,
      extended: null,
      inUse: assetInUse.has(a.id),
    })),
  ];

  return (
    <>
      <PageHeader
        title="Technologies & EOL"
        description="Chronological lifecycle view of technologies, applications and infrastructure with EOL warning thresholds."
      >
        <SubNav items={TECH_TABS} active="/technologies/timeline" />
      </PageHeader>
      <LifecycleTimeline items={items} today={model.today} />
    </>
  );
}
