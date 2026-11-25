import { pluralize } from "@/lib/utils";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** One whole split into parts – 2px surface gaps between segments, legend with counts below. */
export function SegmentedBar({ segments, unit = "item" }: { segments: Segment[]; unit?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {total === 0 ? (
          <div className="h-full w-full bg-muted" />
        ) : (
          visible.map((s) => (
            <div
              key={s.label}
              className="h-full first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              title={`${s.label}: ${pluralize(s.value, unit)} (${Math.round((s.value / total) * 100)}%)`}
            />
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="tabular font-medium text-foreground">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
