import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon,
  href,
  children,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
  /** Status color for the icon chip. */
  accent?: string;
}) {
  const body = (
    <Card className={cn("flex h-full flex-col gap-3 p-4 transition-colors", href && "hover:border-ring/40 hover:bg-muted/30")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className="grid size-8 place-items-center rounded-lg [&_svg]:size-4"
          style={{
            background: `color-mix(in oklab, ${accent ?? "var(--primary)"} 13%, transparent)`,
            color: accent ?? "var(--primary)",
          }}
        >
          {icon}
        </span>
      </div>
      <span className="text-3xl font-semibold tracking-tight">{value}</span>
      {children && <div className="text-xs text-muted-foreground">{children}</div>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
