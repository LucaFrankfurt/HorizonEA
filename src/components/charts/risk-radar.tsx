"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RISK_META, type RiskLevel } from "@/lib/risk";

export interface RadarPoint {
  id: string;
  name: string;
  businessDomain: string;
  criticality: string;
  level: RiskLevel;
  score: number;
  findings: { severity: string; message: string }[];
}

const RINGS: { level: Exclude<RiskLevel, "none">; inner: number; outer: number; color: string }[] = [
  { level: "critical", inner: 0, outer: 0.46, color: "var(--status-critical)" },
  { level: "high", inner: 0.46, outer: 0.7, color: "var(--status-serious)" },
  { level: "medium", inner: 0.7, outer: 0.87, color: "var(--status-warning)" },
  { level: "low", inner: 0.87, outer: 1, color: "var(--status-info)" },
];
const DOT_R: Record<string, number> = { "Tier 1": 7, "Tier 2": 5.5, "Tier 3": 4.5 };

const SIZE = 660;
const C = SIZE / 2;
const R = 215;

/** Deterministic pseudo-random in [0,1) from a string, so positions are stable between renders. */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Risk radar: rings encode severity (critical in the centre), sectors are
 * business domains, dot size encodes business criticality.
 */
export function RiskRadar({ points, domains }: { points: RadarPoint[]; domains: string[] }) {
  const router = useRouter();
  const [hover, setHover] = useState<{ p: RadarPoint; x: number; y: number } | null>(null);
  const sector = (2 * Math.PI) / Math.max(domains.length, 1);

  const placed = useMemo(() => {
    const byCell = new Map<string, RadarPoint[]>();
    for (const p of points) {
      if (p.level === "none") continue;
      const key = `${p.businessDomain}|${p.level}`;
      byCell.set(key, [...(byCell.get(key) ?? []), p]);
    }
    const out: (RadarPoint & { x: number; y: number; r: number })[] = [];
    for (const [key, cell] of byCell) {
      const [domain, level] = key.split("|");
      const di = domains.indexOf(domain);
      const ring = RINGS.find((r) => r.level === level)!;
      cell.sort((a, b) => b.score - a.score);
      cell.forEach((p, i) => {
        const slot = (i + 0.5) / cell.length;
        const angle = -Math.PI / 2 + di * sector + sector * (0.12 + 0.76 * slot);
        // Spread dots radially within their ring; alternate rows avoid overlaps in crowded cells.
        const lane = cell.length > 3 ? (i % 2 === 0 ? 0.3 : 0.7) : 0.25 + 0.5 * hash(p.id);
        const inner = ring.level === "critical" ? 0.12 : ring.inner;
        const radius = (inner + (ring.outer - inner) * lane) * R;
        out.push({ ...p, x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle), r: DOT_R[p.criticality] ?? 5 });
      });
    }
    return out;
  }, [points, domains, sector]);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block h-auto w-full max-w-[600px]" role="img" aria-label="Risk radar of operational applications by business domain and risk level">
        {[...RINGS].reverse().map((ring) => (
          <circle key={ring.level} cx={C} cy={C} r={ring.outer * R} fill={`color-mix(in oklab, ${ring.color} 7%, var(--chart-surface))`} stroke="var(--grid)" strokeWidth={1} />
        ))}
        {domains.map((d, i) => {
          const a = -Math.PI / 2 + i * sector;
          return <line key={d} x1={C} y1={C} x2={C + R * Math.cos(a)} y2={C + R * Math.sin(a)} stroke="var(--grid)" strokeWidth={1} />;
        })}
        {RINGS.map((ring) => (
          <text
            key={ring.level}
            x={C}
            y={C - (ring.level === "critical" ? 0.06 : (ring.inner + ring.outer) / 2) * R}
            fontSize={10}
            fill="var(--muted-foreground)"
            textAnchor="middle"
            dominantBaseline="middle"
            stroke={`color-mix(in oklab, ${ring.color} 7%, var(--chart-surface))`}
            strokeWidth={4}
            paintOrder="stroke"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            {RISK_META[ring.level].label}
          </text>
        ))}
        {domains.map((d, i) => {
          const a = -Math.PI / 2 + (i + 0.5) * sector;
          const x = C + (R + 18) * Math.cos(a);
          const y = C + (R + 18) * Math.sin(a);
          const anchor = Math.abs(Math.cos(a)) < 0.25 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
          const words = d.split(" ");
          const lines = d.length > 13 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [d];
          return (
            <text key={d} x={x} y={y} fontSize={11} fill="var(--foreground)" textAnchor={anchor} dominantBaseline="middle">
              {lines.map((line, li) => (
                <tspan key={li} x={x} dy={li === 0 ? (lines.length > 1 ? -6 : 0) : 13}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
        {placed.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={hover?.p.id === p.id ? p.r + 2 : p.r}
            fill={RINGS.find((r) => r.level === p.level)!.color}
            stroke="var(--chart-surface)"
            strokeWidth={2}
            className="cursor-pointer transition-[r]"
            onMouseEnter={(e) => setHover({ p, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setHover({ p, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHover(null)}
            onClick={() => router.push(`/applications/${p.id}`)}
          >
            <title>{`${p.name} – ${RISK_META[p.level].label} risk`}</title>
          </circle>
        ))}
      </svg>
      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 w-72 rounded-md border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(hover.x + 14, window.innerWidth - 300), top: hover.y + 14 }}
        >
          <p className="text-sm font-medium">{hover.p.name}</p>
          <p className="text-muted-foreground">
            {hover.p.businessDomain} · {hover.p.criticality} · {RISK_META[hover.p.level].label} risk (score {hover.p.score})
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {hover.p.findings.slice(0, 3).map((f, i) => (
              <li key={i} className="leading-snug">
                <span className="font-medium capitalize">{f.severity}:</span> {f.message}
              </li>
            ))}
            {hover.p.findings.length > 3 && <li className="text-muted-foreground">+{hover.p.findings.length - 3} more</li>}
          </ul>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {RINGS.map((r) => (
          <span key={r.level} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: r.color }} />
            {RISK_META[r.level].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <svg width="34" height="14" aria-hidden>
            <circle cx="5" cy="7" r="4.5" fill="var(--status-neutral)" />
            <circle cx="16" cy="7" r="5.5" fill="var(--status-neutral)" />
            <circle cx="28" cy="7" r="6.5" fill="var(--status-neutral)" />
          </svg>
          Tier 3 → Tier 1
        </span>
      </div>
    </div>
  );
}
