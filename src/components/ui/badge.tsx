import * as React from "react";
import type { Tone } from "@/lib/risk";
import { cn } from "@/lib/utils";

export const TONE_VAR: Record<Tone, string> = {
  red: "var(--status-critical)",
  orange: "var(--status-serious)",
  amber: "var(--status-warning)",
  yellow: "var(--status-mild)",
  green: "var(--status-good)",
  blue: "var(--status-info)",
  violet: "var(--series-7)",
  teal: "var(--series-3)",
  gray: "var(--status-neutral)",
};

interface BadgeProps extends React.ComponentProps<"span"> {
  tone?: Tone;
  /** Show the coloured status dot (identity is never colour alone – the text carries the meaning). */
  dot?: boolean;
  icon?: React.ReactNode;
}

export function Badge({ tone = "gray", dot = true, icon, className, style, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 text-foreground",
        className,
      )}
      style={{
        ...style,
        ["--tone" as string]: TONE_VAR[tone],
        background: "color-mix(in oklab, var(--tone) 11%, transparent)",
        borderColor: "color-mix(in oklab, var(--tone) 32%, transparent)",
      }}
      {...props}
    >
      {icon ?? (dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: "var(--tone)" }} /> : null)}
      <span className="truncate">{children}</span>
    </span>
  );
}
