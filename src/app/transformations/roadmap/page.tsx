import type { Metadata } from "next";
import { PageHeader, SubNav } from "@/components/layout/page-header";
import { Roadmap, type RoadmapInitiative } from "@/components/transformations/roadmap";
import { TRANSFORMATION_TABS } from "@/components/transformations/tabs";
import { initiativeMappings } from "@/lib/data/initiatives";
import { loadModel } from "@/lib/data/model";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const model = await loadModel();
  const mappings = initiativeMappings(model);
  const initiatives: RoadmapInitiative[] = model.initiatives.map((i) => ({
    ...i,
    phases: model.initiativePhases.filter((p) => p.initiativeId === i.id),
    sources: mappings.get(i.id)!.sources,
    targets: mappings.get(i.id)!.targets,
  }));
  return (
    <>
      <PageHeader title="Transformations" description="Roadmap of migration initiatives and their phases / milestones over time.">
        <SubNav items={TRANSFORMATION_TABS} active="/transformations/roadmap" />
      </PageHeader>
      <Roadmap initiatives={initiatives} today={model.today} />
    </>
  );
}
