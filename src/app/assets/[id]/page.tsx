import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddHostedApplication, AssetHeaderActions } from "@/components/assets/asset-actions";
import { CriticalityBadge, EolBadge, LifecycleBadge, RiskBadge, StandardBadge } from "@/components/badges";
import { DeleteButton } from "@/components/forms/delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, relativeFromToday } from "@/lib/dates";
import { loadModel } from "@/lib/data/model";
import { applicationOptions, platformOptions } from "@/lib/data/options";
import { assessAsset, eolStatus, techLabel } from "@/lib/risk";
import { SeverityIcon } from "@/components/badges";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const model = await loadModel();
  return { title: model.assets.find((a) => a.id === id)?.name ?? "IT Asset" };
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;
  const model = await loadModel();
  const asset = model.assets.find((a) => a.id === id);
  if (!asset) notFound();
  const { today } = model;
  const os = asset.operatingSystemId ? model.technologies.find((t) => t.id === asset.operatingSystemId) : undefined;
  const findings = assessAsset(asset, os, today);
  const appsById = new Map(model.applications.map((a) => [a.id, a]));
  const hosted = model.applicationAssets.filter((l) => l.assetId === asset.id).map((l) => ({ link: l, app: appsById.get(l.applicationId)! }));
  const hostedIds = new Set(hosted.map((h) => h.app.id));
  const locations = [...new Set(model.assets.map((a) => a.location).filter(Boolean) as string[])].sort();
  const owners = [...new Set(model.assets.map((a) => a.owner).filter(Boolean) as string[])].sort();
  const hw = eolStatus(asset.eolDate, today);

  const facts: [string, React.ReactNode][] = [
    ["Type", asset.assetType],
    ["Environment", asset.environment],
    ["Location / region", asset.location ?? "—"],
    ["Owner", asset.owner ?? "—"],
    [
      "OS / platform",
      os ? (
        <Link href={`/technologies/${os.id}`} className="hover:text-primary hover:underline">
          {techLabel(os)}
        </Link>
      ) : (
        "—"
      ),
    ],
    [
      "Hardware end of support",
      <span key="eol">
        {formatDate(asset.eolDate)}
        {asset.eolDate && <span className="text-xs text-muted-foreground"> ({relativeFromToday(asset.eolDate, today)})</span>}
      </span>,
    ],
  ];

  return (
    <>
      <PageHeader
        breadcrumb={{ href: "/assets", label: "IT Assets" }}
        title={asset.name}
        description={asset.description}
        actions={<AssetHeaderActions asset={asset} platforms={platformOptions(model.technologies)} locations={locations} owners={owners} />}
      >
        <div className="flex flex-wrap gap-1.5">
          {hw !== "unknown" && <EolBadge status={hw} label={`Hardware: ${hw === "supported" ? "supported" : formatDate(asset.eolDate)}`} />}
          {os && <EolBadge status={eolStatus(os.eolDate, today, os.extendedSupportEndDate)} label={`${techLabel(os)}`} />}
          {os && <StandardBadge value={os.standardizationStatus} />}
        </div>
      </PageHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2.5">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-right text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle findings</CardTitle>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SeverityIcon severity="none" /> Hardware and platform are supported.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <SeverityIcon severity={f.severity} className="mt-0.5 size-4 shrink-0" />
                      {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Hosted applications ({hosted.length})</CardTitle>
              <AddHostedApplication
                assetId={asset.id}
                applications={applicationOptions(model.applications.filter((a) => !hostedIds.has(a.id)))}
              />
            </CardHeader>
            <CardContent>
              {hosted.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications are deployed on this asset.</p>
              ) : (
                <ul className="divide-y">
                  {hosted.map(({ link, app }) => (
                    <li key={link.id} className="flex flex-wrap items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/applications/${app.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                          {app.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{link.role ?? app.businessDomain}</p>
                      </div>
                      <CriticalityBadge value={app.criticality} />
                      <LifecycleBadge value={app.lifecycleStatus} />
                      <RiskBadge level={model.risks.get(app.id)!.level} />
                      <DeleteButton url={`/api/application-assets/${link.id}`} name={`deployment of ${app.name}`} compact />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
