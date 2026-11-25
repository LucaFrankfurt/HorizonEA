import type { Metadata } from "next";
import { PageHeader, SubNav } from "@/components/layout/page-header";
import { KanbanBoard, type BoardCard } from "@/components/transformations/kanban-board";
import { TRANSFORMATION_TABS } from "@/components/transformations/tabs";
import { initiativeMappings } from "@/lib/data/initiatives";
import { loadModel } from "@/lib/data/model";

export const metadata: Metadata = { title: "Transformations" };

export default async function TransformationsPage() {
  const model = await loadModel();
  const mappings = initiativeMappings(model);
  const cards: BoardCard[] = model.initiatives.map((i) => ({ ...i, ...mappings.get(i.id)! }));
  return (
    <>
      <PageHeader
        title="Transformations"
        description="Migration initiatives moving the landscape from As-Is to To-Be. Drag cards between columns to update their status."
      >
        <SubNav items={TRANSFORMATION_TABS} active="/transformations" />
      </PageHeader>
      <KanbanBoard cards={cards} today={model.today} />
    </>
  );
}
