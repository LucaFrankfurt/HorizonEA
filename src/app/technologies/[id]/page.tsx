import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CriticalityBadge, EolBadge, InitiativeStatusBadge, LifecycleBadge, RiskBadge, StandardBadge, StrategyBadge } from "@/components/badges";
import { PageHeader } from "@/components/layout/page-header";
import { TechnologyHeaderActions } from "@/components/technologies/technology-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, relativeFromToday } from "@/lib/dates";
import { STANDARDIZATION_DESCRIPTIONS } from "@/lib/domain";
import { loadModel } from "@/lib/data/model";
import { eolStatus, techLabel } from "@/lib/risk";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const model = await loadModel();
  const tech = model.technologies.find((t) => t.id === id);
  return { title: tech ? techLabel(tech) : "Technology" };
}

export default async function TechnologyDetailPage({ params }: Props) {
  const { id } = await params;
  const model = await loadModel();
  const tech = model.technologies.find((t) => t.id === id);
  if (!tech) notFound();
  const { today } = model;
  const status = eolStatus(tech.eolDate, today, tech.extendedSupportEndDate);

  const appsById = new Map(model.applications.map((a) => [a.id, a]));
  const users = model.applicationTechnologies
    .filter((l) => l.technologyId === tech.id)
    .map((l) => ({ link: l, app: appsById.get(l.applicationId)! }))
    .sort((a, b) => a.app.criticality.localeCompare(b.app.criticality) || a.app.name.localeCompare(b.app.name));
  const hosts = model.assets.filter((a) => a.operatingSystemId === tech.id);
  const hostedApps = new Map<string, string[]>();
  for (const l of model.applicationAssets) {
    if (hosts.some((h) => h.id === l.assetId)) hostedApps.set(l.assetId, [...(hostedApps.get(l.assetId) ?? []), l.applicationId]);
  }
  const initiativeById = new Map(model.initiatives.map((i) => [i.id, i]));
  const techById = new Map(model.technologies.map((t) => [t.id, t]));
  const items = model.initiativeItems.filter((i) => i.sourceTechnologyId === tech.id || i.targetTechnologyId === tech.id);
  const vendors = [...new Set(model.technologies.map((t) => t.vendor).filter(Boolean) as string[])].sort();

  const dates: [string, string | null][] = [
    ["Release", tech.releaseDate],
    ["Official EOL", tech.eolDate],
    ["Extended support end", tech.extendedSupportEndDate],
  ];

  return (
    <>
      <PageHeader
        breadcrumb={{ href: "/technologies", label: "Technologies & EOL" }}
        title={techLabel(tech)}
        description={`${tech.category}${tech.vendor ? ` · ${tech.vendor}` : ""}`}
        actions={<TechnologyHeaderActions tech={tech} vendors={vendors} />}
      >
        <div className="flex flex-wrap gap-1.5">
          <EolBadge status={status} />
          <StandardBadge value={tech.standardizationStatus} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle</CardTitle>
            <CardDescription>{STANDARDIZATION_DESCRIPTIONS[tech.standardizationStatus]}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dates.map(([label, date]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="tabular text-right text-sm">
                  {formatDate(date)}
                  {date && <span className="block text-xs text-muted-foreground">{relativeFromToday(date, today)}</span>}
                </span>
              </div>
            ))}
            {tech.notes && <p className="text-sm text-muted-foreground">{tech.notes}</p>}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Used by {users.length} application{users.length === 1 ? "" : "s"}</CardTitle>
            <CardDescription>Direct usage recorded in application technology stacks.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {users.length === 0 ? (
              <p className="px-5 text-sm text-muted-foreground">No application uses this technology directly.</p>
            ) : (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH className="pl-5">Application</TH>
                    <TH>Usage</TH>
                    <TH>Criticality</TH>
                    <TH>Lifecycle</TH>
                    <TH>Risk</TH>
                  </TR>
                </THead>
                <TBody>
                  {users.map(({ link, app }) => {
                    const risk = model.risks.get(app.id)!;
                    return (
                      <TR key={link.id}>
                        <TD className="pl-5">
                          <Link href={`/applications/${app.id}`} className="font-medium hover:text-primary hover:underline">
                            {app.name}
                          </Link>
                        </TD>
                        <TD className="text-muted-foreground">{link.usage ?? "—"}</TD>
                        <TD>
                          <CriticalityBadge value={app.criticality} />
                        </TD>
                        <TD>
                          <LifecycleBadge value={app.lifecycleStatus} />
                        </TD>
                        <TD>
                          <RiskBadge level={risk.level} />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {hosts.length > 0 && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Running on {hosts.length} IT asset{hosts.length === 1 ? "" : "s"}</CardTitle>
              <CardDescription>Assets using this technology as operating system / platform – their applications inherit its EOL risk.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {hosts.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/assets/${h.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                      {h.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {h.assetType} · {h.environment} · {hostedApps.get(h.id)?.map((a) => appsById.get(a)?.name).join(", ") || "no applications"}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transformations</CardTitle>
            <CardDescription>Initiatives replacing or introducing this technology.</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not referenced by any initiative.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((item) => {
                  const initiative = initiativeById.get(item.initiativeId)!;
                  const isSource = item.sourceTechnologyId === tech.id;
                  const other = isSource ? item.targetTechnologyId : item.sourceTechnologyId;
                  const otherTech = other ? techById.get(other) : undefined;
                  return (
                    <li key={item.id} className="flex flex-col gap-1">
                      <Link href={`/transformations/${initiative.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                        {initiative.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {isSource ? (otherTech ? `Replaced by ${techLabel(otherTech)}` : "Removed") : `Replaces ${otherTech ? techLabel(otherTech) : "—"}`}
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
    </>
  );
}
