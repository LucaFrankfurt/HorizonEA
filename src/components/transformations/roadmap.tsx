"use client";

import { useMemo, useState } from "react";
import { InitiativeStatusBadge } from "@/components/badges";
import { Gantt, LegendItem, type GanttRow } from "@/components/charts/gantt";
import { FilterSelect } from "@/components/data-table-tools";
import { Card } from "@/components/ui/card";
import { INITIATIVE_STATUSES, MIGRATION_STRATEGIES } from "@/lib/domain";
import type { Initiative, InitiativePhase } from "@/lib/db/schema";
import { cn, formatCurrency } from "@/lib/utils";

const PHASE_COLOR = { Completed: "var(--status-good)", "In Progress": "var(--status-info)", Planned: "var(--status-neutral)" } as const;

export interface RoadmapInitiative extends Initiative {
  phases: InitiativePhase[];
  sources: string[];
  targets: string[];
}

export function Roadmap({ initiatives, today }: { initiatives: RoadmapInitiative[]; today: string }) {
  const [strategy, setStrategy] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [groupBy, setGroupBy] = useState<"status" | "strategy">("status");

  const dates = initiatives.flatMap((i) => [i.startDate, i.targetDate, ...i.phases.flatMap((p) => [p.startDate, p.endDate])]).filter(Boolean) as string[];
  const year = Number(today.slice(0, 4));
  const minYear = Math.min(year - 1, ...dates.map((d) => Number(d.slice(0, 4))));
  const maxYear = Math.max(year + 1, ...dates.map((d) => Number(d.slice(0, 4))));
  const rangeStart = `${Math.max(minYear, year - 3)}-01-01`;
  const rangeEnd = `${Math.min(maxYear, year + 6)}-12-31`;

  const rows = useMemo(() => {
    const order = groupBy === "status" ? ["In Progress", "Blocked", "Backlog", "Completed"] : [...MIGRATION_STRATEGIES];
    return initiatives
      .filter((i) => (!strategy || i.strategy === strategy) && (!hideCompleted || i.status !== "Completed"))
      .sort(
        (a, b) =>
          order.indexOf(groupBy === "status" ? a.status : a.strategy) - order.indexOf(groupBy === "status" ? b.status : b.strategy) ||
          (a.startDate ?? "").localeCompare(b.startDate ?? ""),
      )
      .map<GanttRow>((i) => {
        const phases = i.phases.filter((p) => p.startDate && p.endDate);
        const segments = phases.length
          ? phases.map((p) => ({
              start: p.startDate!,
              end: p.endDate!,
              color: PHASE_COLOR[p.status],
              label: p.name,
              detail: [`${p.status}`, i.name],
            }))
          : i.startDate && i.targetDate
            ? [{ start: i.startDate, end: i.targetDate, color: "var(--status-neutral)", label: i.name, detail: ["No phases defined"] }]
            : [];
        return {
          id: i.id,
          group: groupBy === "status" ? i.status : i.strategy,
          label: i.name,
          sublabel: `${i.strategy} · ${i.sources.slice(0, 2).join(", ") || "—"} → ${i.targets.slice(0, 2).join(", ") || "retire"}`,
          href: `/transformations/${i.id}`,
          trailing: groupBy === "strategy" ? <InitiativeStatusBadge value={i.status} /> : undefined,
          segments,
          markers: i.targetDate
            ? [
                {
                  date: i.targetDate,
                  label: `Target completion · ${formatCurrency(i.budget, true)}${i.status !== "Completed" && i.targetDate < today ? " · overdue" : ""}`,
                  color: i.status === "Blocked" ? "var(--status-critical)" : "var(--foreground)",
                },
              ]
            : [],
        };
      });
  }, [initiatives, strategy, hideCompleted, groupBy, today]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect label="Strategies" value={strategy} onChange={setStrategy} options={MIGRATION_STRATEGIES} />
        <div className="inline-flex w-fit rounded-lg border bg-muted p-0.5" role="radiogroup" aria-label="Group by">
          {(["status", "strategy"] as const).map((g) => (
            <button
              key={g}
              role="radio"
              aria-checked={groupBy === g}
              onClick={() => setGroupBy(g)}
              className={cn("cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium capitalize", groupBy === g ? "bg-card shadow-sm" : "text-muted-foreground")}
            >
              By {g}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} />
          Hide completed
        </label>
        <div className="flex flex-wrap gap-x-4 gap-y-1 sm:ml-auto">
          {(["Completed", "In Progress", "Planned"] as const).map((s) => (
            <LegendItem key={s} color={PHASE_COLOR[s]} label={`Phase ${s.toLowerCase()}`} />
          ))}
          <LegendItem color="var(--foreground)" label="Target completion" diamond />
        </div>
      </div>
      <Card className="overflow-hidden">
        <Gantt rows={rows} today={today} rangeStart={rangeStart} rangeEnd={rangeEnd} emptyText="No initiatives match the filters." />
      </Card>
      <p className="text-xs text-muted-foreground">
        {INITIATIVE_STATUSES.map((s) => `${s}: ${initiatives.filter((i) => i.status === s).length}`).join(" · ")}
      </p>
    </div>
  );
}
