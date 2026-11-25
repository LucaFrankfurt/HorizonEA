"use client";

import { useMemo, useState } from "react";
import { Gantt, LegendItem, type GanttRow, type GanttSegment } from "@/components/charts/gantt";
import { FilterSelect, SearchInput } from "@/components/data-table-tools";
import { Card } from "@/components/ui/card";
import { addMonths } from "@/lib/dates";
import { TECH_CATEGORIES } from "@/lib/domain";
import { eolStatus, EOL_STATUS_META, type EolStatus } from "@/lib/risk";
import { cn } from "@/lib/utils";

export interface LifecycleItem {
  id: string;
  kind: "Technology" | "Application" | "Asset";
  label: string;
  sublabel: string;
  category?: string;
  start: string | null;
  eol: string | null;
  extended: string | null;
  inUse: boolean;
  lifecycleStatus?: string;
}

const STATUS_COLOR: Record<EolStatus, string> = {
  supported: "var(--status-good)",
  within12: "var(--status-mild)",
  within6: "var(--status-warning)",
  extended: "var(--status-serious)",
  expired: "var(--status-critical)",
  unknown: "var(--status-neutral)",
};

const RANGES = [
  { label: "3 years", back: 1, forward: 2 },
  { label: "6 years", back: 2, forward: 4 },
  { label: "12 years", back: 5, forward: 7 },
];

const HREF = { Technology: "/technologies", Application: "/applications", Asset: "/assets" } as const;
const GROUP = { Technology: "Technologies", Application: "Applications", Asset: "IT assets" } as const;

function buildSegments(item: LifecycleItem, today: string, rangeStart: string, rangeEnd: string): { segments: GanttSegment[]; status: EolStatus } {
  const start = item.start && item.start > rangeStart ? item.start : rangeStart;
  const segments: GanttSegment[] = [];

  if (item.kind === "Application" && item.lifecycleStatus === "Planned") {
    segments.push({
      start: item.start ?? today,
      end: item.eol ?? rangeEnd,
      color: "var(--status-info)",
      label: `${item.label} – planned`,
      detail: [item.start ? "Planned go-live" : "No go-live date"],
      openEnd: !item.eol,
    });
    return { segments, status: "unknown" };
  }

  const status = item.kind === "Application" && item.lifecycleStatus === "Retired" ? "unknown" : eolStatus(item.eol, today, item.extended);
  if (!item.eol) {
    segments.push({ start, end: rangeEnd, color: STATUS_COLOR.unknown, label: item.label, detail: ["No end-of-life date recorded"], openEnd: true });
    return { segments, status };
  }
  segments.push({
    start,
    end: item.eol,
    color: STATUS_COLOR[status],
    label: `${item.label} – ${item.kind === "Application" ? "operation" : "standard support"}`,
    detail: [`Status: ${EOL_STATUS_META[status].label}`],
  });
  if (item.extended && item.extended > item.eol) {
    segments.push({
      start: item.eol,
      end: item.extended,
      color: "var(--status-serious)",
      hatch: true,
      label: `${item.label} – extended support`,
      detail: ["Paid extended / security-only support"],
    });
  }
  const supportEnd = item.extended && item.extended > item.eol ? item.extended : item.eol;
  if (item.inUse && supportEnd < today && item.lifecycleStatus !== "Retired") {
    segments.push({
      start: supportEnd,
      end: today,
      color: "var(--status-critical)",
      hatch: true,
      label: `${item.label} – in use past end of support`,
      detail: ["Still used by operational applications"],
    });
  }
  return { segments, status };
}

export function LifecycleTimeline({ items, today }: { items: LifecycleItem[]; today: string }) {
  const [kinds, setKinds] = useState<Record<LifecycleItem["kind"], boolean>>({ Technology: true, Application: true, Asset: false });
  const [range, setRange] = useState(1);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [inUseOnly, setInUseOnly] = useState(true);
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  const year = Number(today.slice(0, 4));
  const rangeStart = `${year - RANGES[range].back}-01-01`;
  const rangeEnd = `${year + RANGES[range].forward}-12-31`;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out: (GanttRow & { sortKey: string })[] = [];
    for (const item of items) {
      if (!kinds[item.kind]) continue;
      if (needle && !`${item.label} ${item.sublabel}`.toLowerCase().includes(needle)) continue;
      if (category && item.kind === "Technology" && item.category !== category) continue;
      if (category && item.kind !== "Technology") continue;
      if (inUseOnly && !item.inUse) continue;
      const { segments, status } = buildSegments(item, today, rangeStart, rangeEnd);
      if (atRiskOnly && !(status === "expired" || status === "extended" || status === "within6" || status === "within12")) continue;
      out.push({
        id: `${item.kind}-${item.id}`,
        group: GROUP[item.kind],
        label: item.label,
        sublabel: item.sublabel,
        href: `${HREF[item.kind]}/${item.id}`,
        segments,
        markers: item.eol
          ? [{ date: item.eol, label: item.kind === "Application" ? "Planned EOL" : item.kind === "Asset" ? "Hardware end of support" : "Official EOL", color: STATUS_COLOR[status] }]
          : [],
        sortKey: `${["Technology", "Application", "Asset"].indexOf(item.kind)}|${item.eol ?? "9999"}|${item.label}`,
      });
    }
    return out.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [items, kinds, q, category, inUseOnly, atRiskOnly, today, rangeStart, rangeEnd]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search…" />
        <FilterSelect label="Technology categories" value={category} onChange={setCategory} options={TECH_CATEGORIES} />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {(Object.keys(kinds) as LifecycleItem["kind"][]).map((k) => (
            <label key={k} className="flex items-center gap-1.5">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={kinds[k]} onChange={(e) => setKinds({ ...kinds, [k]: e.target.checked })} />
              {GROUP[k]}
            </label>
          ))}
          <span className="hidden h-4 w-px bg-border sm:block" />
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={inUseOnly} onChange={(e) => setInUseOnly(e.target.checked)} />
            In use only
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={atRiskOnly} onChange={(e) => setAtRiskOnly(e.target.checked)} />
            EOL warnings only
          </label>
        </div>
        <div className="inline-flex rounded-lg border bg-muted p-0.5 lg:ml-auto" role="radiogroup" aria-label="Time range">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              role="radio"
              aria-checked={range === i}
              onClick={() => setRange(i)}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium",
                range === i ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendItem color={STATUS_COLOR.supported} label="Supported" />
        <LegendItem color={STATUS_COLOR.within12} label="EOL within 12 months" />
        <LegendItem color={STATUS_COLOR.within6} label="EOL within 6 months" />
        <LegendItem color={STATUS_COLOR.expired} label="Past EOL" />
        <LegendItem color="var(--status-serious)" label="Extended support" hatch />
        <LegendItem color="var(--status-critical)" label="In use past end of support" hatch />
        <LegendItem color="var(--status-info)" label="Planned application" />
        <LegendItem color={STATUS_COLOR.unknown} label="No EOL date" />
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-4 rounded-[3px]" style={{ background: "color-mix(in oklab, var(--status-warning) 25%, transparent)" }} />
          6-month warning window (until {addMonths(today, 6)})
        </span>
      </div>

      <Card className="overflow-hidden">
        <Gantt rows={rows} today={today} rangeStart={rangeStart} rangeEnd={rangeEnd} warningMonths={6} />
      </Card>
      <p className="text-xs text-muted-foreground">
        Showing {rows.length} item{rows.length === 1 ? "" : "s"}. Bars run from release / go-live to the official EOL date; colour reflects today&apos;s
        status. Hover a bar for details.
      </p>
    </div>
  );
}
