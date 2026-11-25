import type { Metadata } from "next";
import { AssetsTable, type AssetRow } from "@/components/assets/assets-table";
import { PageHeader } from "@/components/layout/page-header";
import { loadModel } from "@/lib/data/model";
import { platformOptions } from "@/lib/data/options";
import { eolStatus, techLabel } from "@/lib/risk";

export const metadata: Metadata = { title: "IT Assets" };

export default async function AssetsPage() {
  const model = await loadModel();
  const techById = new Map(model.technologies.map((t) => [t.id, t]));
  const rows: AssetRow[] = model.assets.map((a) => {
    const os = a.operatingSystemId ? techById.get(a.operatingSystemId) : undefined;
    return {
      ...a,
      platform: os ? techLabel(os) : null,
      platformEol: os ? eolStatus(os.eolDate, model.today, os.extendedSupportEndDate) : null,
      hardwareEol: eolStatus(a.eolDate, model.today),
      hosted: model.applicationAssets.filter((l) => l.assetId === a.id).length,
    };
  });
  const locations = [...new Set(model.assets.map((a) => a.location).filter(Boolean) as string[])].sort();
  const owners = [...new Set(model.assets.map((a) => a.owner).filter(Boolean) as string[])].sort();
  return (
    <>
      <PageHeader
        title="IT Assets & Infrastructure"
        description="Servers, clusters, cloud accounts, network and storage devices – with platform and hardware end-of-support tracking."
      />
      <AssetsTable rows={rows} platforms={platformOptions(model.technologies)} locations={locations} owners={owners} />
    </>
  );
}
