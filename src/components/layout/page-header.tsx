import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {breadcrumb && (
        <Link href={breadcrumb.href} className="w-fit text-xs text-muted-foreground hover:text-foreground">
          ← {breadcrumb.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Link-based sub navigation (tabs). */
export function SubNav({ items, active }: { items: { href: string; label: string }[]; active: string }) {
  return (
    <div className="flex gap-1 border-b">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            item.href === active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
