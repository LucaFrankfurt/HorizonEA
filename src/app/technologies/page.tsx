import type { Metadata } from "next";
import { PageHeader, SubNav } from "@/components/layout/page-header";
import { TECH_TABS } from "@/components/technologies/tabs";
import { TechnologiesTable, type TechnologyRow } from "@/components/technologies/technologies-table";
import { loadModel } from "@/lib/data/model";
import { eolStatus } from "@/lib/risk";

export const metadata: Metadata = { title: "Technologies & EOL" };

export default async function TechnologiesPage() {
  const model = await loadModel();
  const rows: TechnologyRow[] = model.technologies.map((t) => ({
    ...t,
    eol: eolStatus(t.eolDate, model.today, t.extendedSupportEndDate),
    usedBy: new Set(model.applicationTechnologies.filter((l) => l.technologyId === t.id).map((l) => l.applicationId)).size,
    hosts: model.assets.filter((a) => a.operatingSystemId === t.id).length,
  }));
  const vendors = [...new Set(model.technologies.map((t) => t.vendor).filter(Boolean) as string[])].sort();
  return (
    <>
      <PageHeader
        title="Technologies & EOL"
        description="Technology catalog with vendor lifecycle dates and standardization status (Approved → Containment → Sunset → Prohibited)."
      >
        <SubNav items={TECH_TABS} active="/technologies" />
      </PageHeader>
      <TechnologiesTable rows={rows} today={model.today} vendors={vendors} />
    </>
  );
}
