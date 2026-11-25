import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AddAssetLink,
  AddInterface,
  AddTechnologyLink,
  ApplicationHeaderActions,
} from "@/components/applications/application-actions";
import { InterfaceList, type InterfaceRow } from "@/components/applications/interface-list";
import {
  CriticalityBadge,
  DeltaBadge,
  EolBadge,
  InitiativeStatusBadge,
  LifecycleBadge,
  RiskBadge,
  SeverityIcon,
  StandardBadge,
  StateBadge,
  StrategyBadge,
} from "@/components/badges";
import { DeleteButton } from "@/components/forms/delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, relativeFromToday } from "@/lib/dates";
import { loadModel } from "@/lib/data/model";
import { applicationOptions, assetOptions, technologyOptions } from "@/lib/data/options";
import { eolStatus, techLabel } from "@/lib/risk";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const model = await loadModel();
  return { title: model.applications.find((a) => a.id === id)?.name ?? "Application" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const model = await loadModel();
  const app = model.applications.find((a) => a.id === id);
  if (!app) notFound();

  const { today } = model;
  const risk = model.risks.get(app.id)!;
  const appsById = new Map(model.applications.map((a) => [a.id, a]));
  const techById = new Map(model.technologies.map((t) => [t.id, t]));
  const assetById = new Map(model.assets.map((a) => [a.id, a]));

  const techLinks = model.applicationTechnologies
    .filter((l) => l.applicationId === app.id)
    .map((l) => ({ link: l, tech: techById.get(l.technologyId)! }))
    .sort((a, b) => a.tech.category.localeCompare(b.tech.category));
  const assetLinks = model.applicationAssets
    .filter((l) => l.applicationId === app.id)
    .map((l) => ({ link: l, asset: assetById.get(l.assetId)! }));
  const interfaces: InterfaceRow[] = model.interfaces
    .filter((i) => i.sourceApplicationId === app.id || i.targetApplicationId === app.id)
    .map((i) => {
      const outbound = i.sourceApplicationId === app.id;
      const partnerId = outbound ? i.targetApplicationId : i.sourceApplicationId;
      return { ...i, outbound, partnerId, partnerName: appsById.get(partnerId)?.name ?? "Unknown" };
    });
  const initiativeById = new Map(model.initiatives.map((i) => [i.id, i]));
  const transformations = model.initiativeItems
    .filter((item) => item.sourceApplicationId === app.id || item.targetApplicationId === app.id)
    .map((item) => ({ item, initiative: initiativeById.get(item.initiativeId)! }));

  const domains = [...new Set(model.applications.map((a) => a.businessDomain))].sort();
  const linkedTech = new Set(techLinks.map((t) => t.tech.id));
  const linkedAssets = new Set(assetLinks.map((a) => a.asset.id));
  const appOpts = applicationOptions(model.applications);
  const eol = app.plannedEolDate ? eolStatus(app.plannedEolDate, today) : null;

  return (
    <>
      <PageHeader
        breadcrumb={{ href: "/applications", label: "Applications" }}
        title={app.name}
        description={app.description}
        actions={<ApplicationHeaderActions app={app} domains={domains} />}
      >
        <div className="flex flex-wrap gap-1.5">
          <CriticalityBadge value={app.criticality} />
          <LifecycleBadge value={app.lifecycleStatus} />
          <StateBadge value={app.architectureState} />
          <DeltaBadge status={model.deltas.get(app.id)!} />
          <RiskBadge level={risk.level} score={risk.score} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Business domain">{app.businessDomain}</Field>
                <Field label="Owner / team">{app.owner ?? "—"}</Field>
                <Field label="Hosting model">{app.hostingModel}</Field>
                <Field label="Go-live">{formatDate(app.goLiveDate)}</Field>
                <Field label="Planned EOL">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {formatDate(app.plannedEolDate)}
                    {app.plannedEolDate && <span className="text-xs text-muted-foreground">({relativeFromToday(app.plannedEolDate, today)})</span>}
                    {eol && app.lifecycleStatus !== "Retired" && eol !== "supported" && eol !== "unknown" && <EolBadge status={eol} />}
                  </span>
                </Field>
                <Field label="Interfaces">{interfaces.length}</Field>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk assessment</CardTitle>
              <CardDescription>
                Derived from technology EOL & standards, hosting assets, interface partners and lifecycle rules. Score = Σ severity
                weight × criticality factor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {risk.findings.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SeverityIcon severity="none" /> No risks detected.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {risk.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <SeverityIcon severity={f.severity} className="mt-0.5 size-4 shrink-0" />
                      <span>
                        <span className="mr-1.5 text-[11px] font-semibold uppercase text-muted-foreground">{f.severity}</span>
                        {f.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>Interfaces & data flows</CardTitle>
                <CardDescription>Filtered by the global architecture state switcher.</CardDescription>
              </div>
              <AddInterface applicationId={app.id} applications={appOpts} />
            </CardHeader>
            <CardContent>
              <InterfaceList rows={interfaces} applications={appOpts} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Technology stack</CardTitle>
              <AddTechnologyLink
                applicationId={app.id}
                technologies={technologyOptions(model.technologies.filter((t) => !linkedTech.has(t.id)))}
              />
            </CardHeader>
            <CardContent>
              {techLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No technologies recorded.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {techLinks.map(({ link, tech }) => (
                    <li key={link.id} className="flex items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/technologies/${tech.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                          {techLabel(tech)}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {tech.category}
                          {link.usage ? ` · ${link.usage}` : ""} · EOL {formatDate(tech.eolDate)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <EolBadge status={eolStatus(tech.eolDate, today, tech.extendedSupportEndDate)} />
                          <StandardBadge value={tech.standardizationStatus} />
                        </div>
                      </div>
                      <DeleteButton url={`/api/application-technologies/${link.id}`} name={`${techLabel(tech)} from ${app.name}`} compact />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Deployments / hosting</CardTitle>
              <AddAssetLink applicationId={app.id} assets={assetOptions(model.assets.filter((a) => !linkedAssets.has(a.id)))} />
            </CardHeader>
            <CardContent>
              {assetLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No IT assets recorded.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {assetLinks.map(({ link, asset }) => {
                    const os = asset.operatingSystemId ? techById.get(asset.operatingSystemId) : undefined;
                    const status = eolStatus(asset.eolDate, today);
                    return (
                      <li key={link.id} className="flex items-center gap-2 py-2">
                        <div className="min-w-0 flex-1">
                          <Link href={`/assets/${asset.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                            {asset.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {asset.assetType} · {asset.environment}
                            {link.role ? ` · ${link.role}` : ""}
                            {os ? ` · ${techLabel(os)}` : ""}
                          </p>
                          {(status === "expired" || status === "within6" || status === "within12") && (
                            <div className="mt-1">
                              <EolBadge status={status} label={`Hardware ${status === "expired" ? "past EOL" : `EOL ${formatDate(asset.eolDate)}`}`} />
                            </div>
                          )}
                        </div>
                        <DeleteButton url={`/api/application-assets/${link.id}`} name={`deployment on ${asset.name}`} compact />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transformations</CardTitle>
              <CardDescription>Initiatives that migrate from or to this application.</CardDescription>
            </CardHeader>
            <CardContent>
              {transformations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not part of any initiative.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {transformations.map(({ item, initiative }) => {
                    const other =
                      item.sourceApplicationId === app.id ? item.targetApplicationId : item.sourceApplicationId;
                    const role =
                      item.sourceApplicationId === app.id && item.targetApplicationId === app.id
                        ? "Transformed in place"
                        : item.sourceApplicationId === app.id
                          ? other
                            ? `Migrates to ${appsById.get(other)?.name}`
                            : "Decommissioned"
                          : `Replaces ${other ? appsById.get(other)?.name : "—"}`;
                    return (
                      <li key={item.id} className="flex flex-col gap-1">
                        <Link href={`/transformations/${initiative.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                          {initiative.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {role} · target {formatDate(initiative.targetDate)}
                        </span>
                        <span className="flex gap-1">
                          <StrategyBadge value={initiative.strategy} />
                          <InitiativeStatusBadge value={initiative.status} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
