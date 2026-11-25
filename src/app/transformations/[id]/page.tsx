import { ArrowRight, Cpu, AppWindow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EolBadge, InitiativeStatusBadge, LifecycleBadge, PhaseStatusBadge, RiskLevelBadge, StateBadge, StrategyBadge } from "@/components/badges";
import { Gantt } from "@/components/charts/gantt";
import { DeleteButton } from "@/components/forms/delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { AddItemButton, AddPhaseButton, EditItemButton, EditPhaseButton, InitiativeHeaderActions } from "@/components/transformations/initiative-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { daysBetween, formatDate, relativeFromToday } from "@/lib/dates";
import { STRATEGY_DESCRIPTIONS } from "@/lib/domain";
import { loadModel } from "@/lib/data/model";
import { applicationOptions, technologyOptions } from "@/lib/data/options";
import { eolStatus, techLabel } from "@/lib/risk";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Application, Technology } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const model = await loadModel();
  return { title: model.initiatives.find((i) => i.id === id)?.name ?? "Initiative" };
}

function AppChip({ app }: { app?: Application }) {
  if (!app) return <span className="text-sm italic text-muted-foreground">— none (retire / new build)</span>;
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <Link href={`/applications/${app.id}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary hover:underline">
        <AppWindow className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{app.name}</span>
      </Link>
      <span className="flex flex-wrap gap-1">
        <LifecycleBadge value={app.lifecycleStatus} />
        <StateBadge value={app.architectureState} />
      </span>
    </span>
  );
}

function TechChip({ tech, today }: { tech?: Technology; today: string }) {
  if (!tech) return <span className="text-sm italic text-muted-foreground">— none (removed)</span>;
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <Link href={`/technologies/${tech.id}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary hover:underline">
        <Cpu className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{techLabel(tech)}</span>
      </Link>
      <span className="flex flex-wrap gap-1">
        <EolBadge status={eolStatus(tech.eolDate, today, tech.extendedSupportEndDate)} />
      </span>
    </span>
  );
}

export default async function InitiativeDetailPage({ params }: Props) {
  const { id } = await params;
  const model = await loadModel();
  const initiative = model.initiatives.find((i) => i.id === id);
  if (!initiative) notFound();
  const { today } = model;
  const appById = new Map(model.applications.map((a) => [a.id, a]));
  const techById = new Map(model.technologies.map((t) => [t.id, t]));
  const items = model.initiativeItems.filter((i) => i.initiativeId === id);
  const phases = model.initiativePhases.filter((p) => p.initiativeId === id).sort((a, b) => a.sortOrder - b.sortOrder);
  const appOpts = applicationOptions(model.applications);
  const techOpts = technologyOptions(model.technologies);
  const done = phases.filter((p) => p.status === "Completed").length;
  const overdue = initiative.status !== "Completed" && initiative.targetDate && initiative.targetDate < today;

  const phaseDates = phases.flatMap((p) => [p.startDate, p.endDate]).filter(Boolean) as string[];
  const allDates = [...phaseDates, initiative.startDate, initiative.targetDate, today].filter(Boolean) as string[];
  const minDate = allDates.reduce((a, b) => (a < b ? a : b));
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b));

  const facts: [string, React.ReactNode][] = [
    ["Owner", initiative.owner ?? "—"],
    ["Start", formatDate(initiative.startDate)],
    [
      "Target completion",
      <span key="t">
        {formatDate(initiative.targetDate)}
        {initiative.targetDate && (
          <span className="block text-xs text-muted-foreground">
            {relativeFromToday(initiative.targetDate, today)}
            {overdue ? " · overdue" : ""}
          </span>
        )}
      </span>,
    ],
    [
      "Duration",
      initiative.startDate && initiative.targetDate ? `${Math.round(daysBetween(initiative.startDate, initiative.targetDate) / 30.44)} months` : "—",
    ],
    ["Budget", formatCurrency(initiative.budget)],
    ["Effort", initiative.effortPersonDays ? `${formatNumber(initiative.effortPersonDays)} person-days` : "—"],
    ["Phase progress", phases.length ? `${done} of ${phases.length} completed` : "—"],
  ];

  return (
    <>
      <PageHeader
        breadcrumb={{ href: "/transformations", label: "Transformations" }}
        title={initiative.name}
        description={initiative.description}
        actions={<InitiativeHeaderActions initiative={initiative} />}
      >
        <div className="flex flex-wrap gap-1.5">
          <StrategyBadge value={initiative.strategy} />
          <InitiativeStatusBadge value={initiative.status} />
          <RiskLevelBadge value={initiative.riskLevel} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                {initiative.strategy}: {STRATEGY_DESCRIPTIONS[initiative.strategy]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2.5">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="tabular text-right text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Risk notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{initiative.riskNotes || "No risk notes recorded."}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>As-Is → To-Be mapping</CardTitle>
                <CardDescription>Which current applications and technologies move to which target.</CardDescription>
              </div>
              <AddItemButton initiativeId={id} applications={appOpts} technologies={techOpts} />
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mappings yet.</p>
              ) : (
                <ul className="flex flex-col divide-y rounded-lg border">
                  {items.map((item) => (
                    <li key={item.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-3 py-2.5">
                      {item.kind === "Application" ? (
                        <>
                          <AppChip app={item.sourceApplicationId ? appById.get(item.sourceApplicationId) : undefined} />
                          <ArrowRight className="size-4 text-muted-foreground" />
                          <AppChip app={item.targetApplicationId ? appById.get(item.targetApplicationId) : undefined} />
                        </>
                      ) : (
                        <>
                          <TechChip tech={item.sourceTechnologyId ? techById.get(item.sourceTechnologyId) : undefined} today={today} />
                          <ArrowRight className="size-4 text-muted-foreground" />
                          <TechChip tech={item.targetTechnologyId ? techById.get(item.targetTechnologyId) : undefined} today={today} />
                        </>
                      )}
                      <span className="flex">
                        <EditItemButton item={item} applications={appOpts} technologies={techOpts} />
                        <DeleteButton url={`/api/initiative-items/${item.id}`} name="this mapping" compact />
                      </span>
                      {item.notes && <p className="col-span-4 -mt-1 text-xs text-muted-foreground">{item.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>Phases & milestones</CardTitle>
                <CardDescription>
                  {done} of {phases.length} completed
                </CardDescription>
              </div>
              <AddPhaseButton initiativeId={id} nextOrder={phases.length} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {phases.length > 0 && (
                <div className="overflow-hidden rounded-lg border">
                  <Gantt
                    today={today}
                    rangeStart={`${minDate.slice(0, 4)}-01-01`}
                    rangeEnd={`${maxDate.slice(0, 4)}-12-31`}
                    rows={phases
                      .filter((p) => p.startDate && p.endDate)
                      .map((p) => ({
                        id: p.id,
                        label: p.name,
                        sublabel: `${formatDate(p.startDate)} – ${formatDate(p.endDate)}`,
                        segments: [
                          {
                            start: p.startDate!,
                            end: p.endDate!,
                            label: p.name,
                            detail: [p.status],
                            color:
                              p.status === "Completed" ? "var(--status-good)" : p.status === "In Progress" ? "var(--status-info)" : "var(--status-neutral)",
                          },
                        ],
                      }))}
                  />
                </div>
              )}
              {phases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No phases defined.</p>
              ) : (
                <ul className="divide-y">
                  {phases.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
                      <span className="min-w-0 flex-1 text-sm">
                        {p.name}
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(p.startDate)} – {formatDate(p.endDate)}
                        </span>
                      </span>
                      <PhaseStatusBadge value={p.status} />
                      <span className="flex">
                        <EditPhaseButton phase={p} />
                        <DeleteButton url={`/api/initiative-phases/${p.id}`} name={`phase "${p.name}"`} compact />
                      </span>
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
