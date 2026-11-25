import type { Metadata } from "next";
import { ApplicationsTable, type ApplicationRow } from "@/components/applications/applications-table";
import { PageHeader } from "@/components/layout/page-header";
import { loadModel } from "@/lib/data/model";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const model = await loadModel();
  const rows: ApplicationRow[] = model.applications.map((a) => {
    const risk = model.risks.get(a.id)!;
    return {
      ...a,
      riskLevel: risk.level,
      riskScore: risk.score,
      delta: model.deltas.get(a.id)!,
      techCount: model.applicationTechnologies.filter((l) => l.applicationId === a.id).length,
      interfaceCount: model.interfaces.filter((i) => i.sourceApplicationId === a.id || i.targetApplicationId === a.id).length,
    };
  });
  const domains = [...new Set(model.applications.map((a) => a.businessDomain))].sort();
  return (
    <>
      <PageHeader
        title="Applications"
        description="Application portfolio with business criticality, lifecycle, architecture state and computed technology risk."
      />
      <ApplicationsTable rows={rows} domains={domains} today={model.today} />
    </>
  );
}
