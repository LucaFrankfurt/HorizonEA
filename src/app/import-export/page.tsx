import type { Metadata } from "next";
import { ImportExportPanel, type CollectionInfo } from "@/components/import-export/import-export-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IMPORT_ORDER, RESOURCES } from "@/lib/api/resources";
import { loadModel } from "@/lib/data/model";
import { csvColumns } from "@/lib/import-export";

export const metadata: Metadata = { title: "Import / Export" };

export default async function ImportExportPage() {
  const model = await loadModel();
  const counts: Record<string, number> = {
    application: model.applications.length,
    technology: model.technologies.length,
    asset: model.assets.length,
    interface: model.interfaces.length,
    applicationTechnology: model.applicationTechnologies.length,
    applicationAsset: model.applicationAssets.length,
    initiative: model.initiatives.length,
    initiativeItem: model.initiativeItems.length,
    initiativePhase: model.initiativePhases.length,
  };
  const order = ["application", "technology", "asset", "interface", "applicationTechnology", "applicationAsset", "initiative", "initiativeItem", "initiativePhase"] as const;
  const collections: CollectionInfo[] = order.map((key) => ({
    key,
    slug: RESOURCES[key].slug,
    label: RESOURCES[key].label,
    count: counts[key],
    columns: csvColumns(key),
  }));

  return (
    <>
      <PageHeader title="Import / Export" description="Bulk backup, reporting and integration via JSON and CSV." />
      <ImportExportPanel collections={collections} allowReset={process.env.ALLOW_DEMO_RESET !== "false"} />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>REST API</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-1 font-mono text-xs text-muted-foreground lg:grid-cols-2">
          {IMPORT_ORDER.map((k) => (
            <p key={k}>
              GET · POST /api/{RESOURCES[k].slug} &nbsp;|&nbsp; GET · PATCH · DELETE /api/{RESOURCES[k].slug}/:id
            </p>
          ))}
          <p>GET /api/export · GET /api/export/:collection?format=csv|json</p>
          <p>POST /api/import (multipart or JSON, mode=merge|replace, dryRun)</p>
          <p>GET /api/dashboard · GET /api/health</p>
          <p>POST /api/demo-data[?empty=1]</p>
        </CardContent>
      </Card>
    </>
  );
}
