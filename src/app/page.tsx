import { AppWindow, CalendarClock, Route, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { EolBadge, InitiativeStatusBadge, RiskBadge, SeverityIcon, StrategyBadge } from "@/components/badges";
import { RiskRadar } from "@/components/charts/risk-radar";
import { SegmentedBar } from "@/components/charts/segmented-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMonth, relativeFromToday } from "@/lib/dates";
import { buildDashboard } from "@/lib/data/dashboard";
import { loadModel } from "@/lib/data/model";
import { DELTA_META, type DeltaStatus } from "@/lib/delta";
import { formatCurrency } from "@/lib/utils";

const KIND_HREF = { technology: "/technologies", asset: "/assets", application: "/applications" } as const;

export default async function DashboardPage() {
  const model = await loadModel();
  const d = buildDashboard(model);
  const { kpis } = d;
  const domains = [...new Set(model.applications.map((a) => a.businessDomain))].sort();

  const deltaCounts = { new: 0, modified: 0, removed: 0, unchanged: 0 } as Record<DeltaStatus, number>;
  for (const a of model.applications) if (a.lifecycleStatus !== "Retired") deltaCounts[model.deltas.get(a.id)!]++;

  const phasesByInitiative = new Map<string, typeof model.initiativePhases>();
  for (const p of model.initiativePhases) phasesByInitiative.set(p.initiativeId, [...(phasesByInitiative.get(p.initiativeId) ?? []), p]);
  const inFlight = model.initiatives
    .filter((i) => i.status === "In Progress" || i.status === "Blocked")
    .sort((a, b) => (a.status === "Blocked" ? -1 : 0) - (b.status === "Blocked" ? -1 : 0) || (a.targetDate ?? "").localeCompare(b.targetDate ?? ""));

  return (
    <>
      <PageHeader
        title="Executive dashboard"
        description={`Portfolio health, lifecycle exposure and transformation progress · as of ${formatDate(d.today)}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active applications" value={kpis.activeApplications} icon={<AppWindow />} href="/applications">
          {kpis.phaseOutApplications} in phase-out · {kpis.plannedApplications} planned · {kpis.totalApplications} total
        </StatTile>
        <StatTile
          label="EOL warnings (next 6 months)"
          value={kpis.eolWithin6}
          icon={<CalendarClock />}
          accent="var(--status-warning)"
          href="/technologies/timeline"
        >
          {kpis.eolWithin12} within 12 months · <span className="text-foreground">{kpis.pastEolInUse} past EOL still in use</span>
        </StatTile>
        <StatTile label="Active migration initiatives" value={kpis.activeInitiatives} icon={<Route />} href="/transformations">
          {kpis.blockedInitiatives} blocked · {formatCurrency(kpis.inFlightBudget, true)} budget in flight
        </StatTile>
        <StatTile
          label="High-risk dependencies"
          value={kpis.highRiskDependencies}
          icon={<ShieldAlert />}
          accent="var(--status-critical)"
          href="/landscape"
        >
          {kpis.criticalDependencies} critical · {kpis.applicationsAtRisk} applications at high or critical risk
        </StatTile>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Risk radar</CardTitle>
            <CardDescription>
              Operational applications running on sunset, prohibited or end-of-life technologies and assets. Centre = most urgent; click a dot
              to open the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskRadar points={d.radar} domains={domains} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Top risks</CardTitle>
            <CardDescription>Ranked by score (severity × business criticality).</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col divide-y">
              {d.radar.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-2.5">
                  <SeverityIcon severity={r.level} className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/applications/${r.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                        {r.name}
                      </Link>
                      <RiskBadge level={r.level} score={r.score} />
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{r.findings[0]?.message}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.criticality} · {r.businessDomain} · {r.findings.length} finding{r.findings.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {d.radar.length > 8 && (
              <Link href="/applications" className="mt-2 inline-block text-xs text-primary hover:underline">
                View all {d.radar.length} applications with findings →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming end-of-life (next 12 months)</CardTitle>
            <CardDescription>Technologies, assets and applications in use whose support ends soon.</CardDescription>
          </CardHeader>
          <CardContent>
            {d.upcomingEol.length === 0 ? (
              <p className="text-sm text-muted-foreground">No EOL dates in the next 12 months.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {d.upcomingEol.map((e) => (
                  <li key={`${e.kind}-${e.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className="tabular w-20 shrink-0 text-xs text-muted-foreground">{formatMonth(e.date)}</span>
                    <span className="min-w-0 flex-1">
                      <Link href={`${KIND_HREF[e.kind]}/${e.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                        {e.name}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {e.kind[0].toUpperCase() + e.kind.slice(1)}
                        {e.kind !== "application" && ` · ${e.impactedApplications} app${e.impactedApplications === 1 ? "" : "s"} affected`}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{relativeFromToday(e.date, d.today)}</span>
                    <EolBadge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>As-Is → To-Be delta</CardTitle>
              <CardDescription>Applications by change type between current and target state.</CardDescription>
            </CardHeader>
            <CardContent>
              <SegmentedBar
                unit="application"
                segments={(["new", "modified", "removed", "unchanged"] as DeltaStatus[]).map((k) => ({
                  label: DELTA_META[k].label,
                  value: deltaCounts[k],
                  color: { new: "var(--status-good)", modified: "var(--status-warning)", removed: "var(--status-critical)", unchanged: "var(--status-neutral)" }[k],
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Application lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <SegmentedBar
                unit="application"
                segments={[
                  { label: "Planned", value: d.distributions.lifecycle.Planned ?? 0, color: "var(--status-info)" },
                  { label: "Active", value: d.distributions.lifecycle.Active ?? 0, color: "var(--status-good)" },
                  { label: "Phase-Out", value: d.distributions.lifecycle["Phase-Out"] ?? 0, color: "var(--status-warning)" },
                  { label: "Retired", value: d.distributions.lifecycle.Retired ?? 0, color: "var(--status-neutral)" },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Technology standards</CardTitle>
            </CardHeader>
            <CardContent>
              <SegmentedBar
                unit="technology"
                segments={[
                  { label: "Approved", value: d.distributions.standardization.Approved ?? 0, color: "var(--status-good)" },
                  { label: "Containment", value: d.distributions.standardization.Containment ?? 0, color: "var(--status-mild)" },
                  { label: "Sunset", value: d.distributions.standardization.Sunset ?? 0, color: "var(--status-serious)" },
                  { label: "Prohibited", value: d.distributions.standardization.Prohibited ?? 0, color: "var(--status-critical)" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Initiatives in flight</CardTitle>
          <CardDescription>In progress and blocked transformations with phase progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inFlight.map((i) => {
              const phases = phasesByInitiative.get(i.id) ?? [];
              const done = phases.filter((p) => p.status === "Completed").length;
              const overdue = i.targetDate && i.targetDate < d.today;
              return (
                <Link key={i.id} href={`/transformations/${i.id}`} className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{i.name}</span>
                    <InitiativeStatusBadge value={i.status} />
                  </div>
                  <div className="flex gap-1">
                    <StrategyBadge value={i.strategy} />
                  </div>
                  <div className="flex h-1.5 gap-[2px]" aria-label={`${done} of ${phases.length} phases completed`}>
                    {phases.map((p) => (
                      <span
                        key={p.id}
                        className="h-full flex-1 rounded-full"
                        title={`${p.name}: ${p.status}`}
                        style={{
                          background:
                            p.status === "Completed" ? "var(--status-good)" : p.status === "In Progress" ? "var(--status-info)" : "var(--muted)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {done}/{phases.length} phases · target {formatDate(i.targetDate)}
                    {overdue ? " · overdue" : ""} · {formatCurrency(i.budget, true)}
                  </span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
