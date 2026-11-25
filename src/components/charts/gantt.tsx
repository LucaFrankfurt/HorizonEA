"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, parseISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface GanttSegment {
  start: string;
  end: string;
  color: string;
  /** Tooltip title. */
  label: string;
  detail?: string[];
  hatch?: boolean;
  /** Fade the right edge (open-ended / unknown end). */
  openEnd?: boolean;
}

export interface GanttMarker {
  date: string;
  label: string;
  color: string;
  shape?: "diamond" | "flag";
}

export interface GanttRow {
  id: string;
  group?: string;
  label: string;
  sublabel?: string;
  href?: string;
  trailing?: React.ReactNode;
  segments: GanttSegment[];
  markers?: GanttMarker[];
}

interface Tooltip {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

const LABEL_W = "clamp(140px, 28vw, 280px)";

/**
 * Lightweight horizontal timeline (Gantt) rendered with HTML positioning.
 * Hairline year/quarter grid, a "today" rule, optional warning window and a
 * per-segment hover tooltip.
 */
export function Gantt({
  rows,
  today,
  rangeStart,
  rangeEnd,
  warningMonths,
  emptyText = "Nothing to show for the current filters.",
}: {
  rows: GanttRow[];
  today: string;
  rangeStart: string;
  rangeEnd: string;
  /** Shade the window between today and today + N months. */
  warningMonths?: number;
  emptyText?: string;
}) {
  const [tip, setTip] = useState<Tooltip | null>(null);
  const t0 = parseISO(rangeStart);
  const t1 = parseISO(rangeEnd);
  const pct = (iso: string) => Math.min(100, Math.max(0, ((parseISO(iso) - t0) / (t1 - t0)) * 100));
  const inRange = (iso: string) => iso >= rangeStart && iso <= rangeEnd;

  const startYear = Number(rangeStart.slice(0, 4));
  const endYear = Number(rangeEnd.slice(0, 4));
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  const span = endYear - startYear + 1;
  const quarters = span <= 8 ? years.flatMap((y) => [`${y}-04-01`, `${y}-07-01`, `${y}-10-01`]).filter(inRange) : [];

  const todayPct = pct(today);
  const warnEnd = warningMonths
    ? (() => {
        const d = new Date(parseISO(today));
        d.setUTCMonth(d.getUTCMonth() + warningMonths);
        return pct(d.toISOString().slice(0, 10));
      })()
    : null;

  const groups: { name: string | undefined; rows: GanttRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.name === row.group) last.rows.push(row);
    else groups.push({ name: row.group, rows: [row] });
  }

  const show = (e: React.MouseEvent, title: string, lines: string[]) =>
    setTip({ x: e.clientX, y: e.clientY, title, lines });

  return (
    <div className="relative overflow-x-auto scrollbar-thin" onMouseLeave={() => setTip(null)}>
      <div className="relative min-w-[760px]" style={{ ["--label-w" as string]: LABEL_W }}>
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-y-0 right-3" style={{ left: "var(--label-w)" }} aria-hidden>
          {warnEnd !== null && warnEnd > todayPct && (
            <div
              className="absolute inset-y-0"
              style={{
                left: `${todayPct}%`,
                width: `${warnEnd - todayPct}%`,
                background: "color-mix(in oklab, var(--status-warning) 9%, transparent)",
              }}
            />
          )}
          {quarters.map((q) => (
            <div key={q} className="absolute inset-y-0 w-px bg-grid opacity-50" style={{ left: `${pct(q)}%` }} />
          ))}
          {years.map((y) =>
            inRange(`${y}-01-01`) ? (
              <div key={y} className="absolute inset-y-0 w-px bg-grid" style={{ left: `${pct(`${y}-01-01`)}%` }} />
            ) : null,
          )}
          {inRange(today) && (
            <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-primary/80" style={{ left: `${todayPct}%` }} />
          )}
        </div>

        {/* Axis */}
        <div className="sticky top-0 z-10 flex h-8 items-end border-b bg-card/95">
          <div className="shrink-0" style={{ width: "var(--label-w)" }} />
          <div className="relative mr-3 h-full flex-1">
            {years.map((y) => {
              const left = pct(`${y}-01-01`);
              const right = pct(`${y + 1}-01-01`);
              if (right <= 0 || left >= 100) return null;
              return (
                <span
                  key={y}
                  className="tabular absolute bottom-1.5 text-center text-[11px] text-muted-foreground"
                  style={{ left: `${left}%`, width: `${right - left}%` }}
                >
                  {y}
                </span>
              );
            })}
            {inRange(today) && (
              <span
                className="absolute top-0.5 -translate-x-1/2 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground"
                style={{ left: `${todayPct}%` }}
              >
                Today
              </span>
            )}
          </div>
        </div>

        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{emptyText}</p>}

        {groups.map((g, gi) => (
          <div key={`${g.name}-${gi}`}>
            {g.name && (
              <div className="flex h-7 items-center border-b bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {g.name} <span className="ml-1.5 font-normal normal-case">({g.rows.length})</span>
              </div>
            )}
            {g.rows.map((row) => (
              <div key={row.id} className="flex min-h-10 items-center border-b border-border/60 last:border-b-0 hover:bg-muted/30">
                <div className="flex shrink-0 items-center gap-2 overflow-hidden px-3 py-1.5" style={{ width: "var(--label-w)" }}>
                  <div className="min-w-0 flex-1">
                    {row.href ? (
                      <Link href={row.href} className="block truncate text-sm font-medium hover:text-primary hover:underline" title={row.label}>
                        {row.label}
                      </Link>
                    ) : (
                      <span className="block truncate text-sm font-medium" title={row.label}>
                        {row.label}
                      </span>
                    )}
                    {row.sublabel && <span className="block truncate text-[11px] text-muted-foreground">{row.sublabel}</span>}
                  </div>
                  {row.trailing}
                </div>
                <div className="relative mr-3 h-10 flex-1">
                  {row.segments.map((s, i) => {
                    if (s.end < rangeStart || s.start > rangeEnd || s.end < s.start) return null;
                    const left = pct(s.start);
                    const width = Math.max(pct(s.end) - left, 0.4);
                    return (
                      <div
                        key={i}
                        className={cn("absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[4px]")}
                        style={{
                          left: `${left}%`,
                          width: `calc(${width}% - 2px)`,
                          background: s.hatch
                            ? `repeating-linear-gradient(135deg, ${s.color} 0 3px, color-mix(in oklab, ${s.color} 30%, transparent) 3px 6px)`
                            : s.openEnd
                              ? `linear-gradient(90deg, ${s.color} 70%, color-mix(in oklab, ${s.color} 0%, transparent))`
                              : s.color,
                        }}
                        onMouseMove={(e) =>
                          show(e, s.label, [`${formatDate(s.start)} → ${s.openEnd ? "open-ended" : formatDate(s.end)}`, ...(s.detail ?? [])])
                        }
                        onMouseLeave={() => setTip(null)}
                      />
                    );
                  })}
                  {row.markers?.map((m, i) =>
                    inRange(m.date) ? (
                      <div
                        key={`m${i}`}
                        className="absolute top-1/2 z-[1] size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] ring-2 ring-[var(--chart-surface)]"
                        style={{ left: `${pct(m.date)}%`, background: m.color }}
                        onMouseMove={(e) => show(e, m.label, [formatDate(m.date)])}
                        onMouseLeave={() => setTip(null)}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-72 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg"
          style={{ left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 300), top: tip.y + 14 }}
        >
          <p className="font-medium">{tip.title}</p>
          {tip.lines.map((l, i) => (
            <p key={i} className="text-muted-foreground">
              {l}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function LegendItem({ color, label, hatch, diamond }: { color: string; label: string; hatch?: boolean; diamond?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        aria-hidden
        className={diamond ? "size-2 rotate-45 rounded-[1px]" : "h-2.5 w-4 rounded-[3px]"}
        style={{
          background: hatch
            ? `repeating-linear-gradient(135deg, ${color} 0 3px, color-mix(in oklab, ${color} 30%, transparent) 3px 6px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}
