"use client";

import { CalendarClock, GripVertical, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RiskLevelBadge, StrategyBadge } from "@/components/badges";
import { FilterSelect, SearchInput } from "@/components/data-table-tools";
import { TONE_VAR } from "@/components/ui/badge";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/dates";
import { INITIATIVE_STATUSES, MIGRATION_STRATEGIES, type InitiativeStatus } from "@/lib/domain";
import type { Initiative } from "@/lib/db/schema";
import type { Tone } from "@/lib/risk";
import { cn, formatCurrency } from "@/lib/utils";
import { NewInitiativeButton } from "./initiative-actions";

export interface BoardCard extends Initiative {
  phasesDone: number;
  phasesTotal: number;
  sources: string[];
  targets: string[];
}

const COLUMN_TONE: Record<InitiativeStatus, Tone> = { Backlog: "gray", "In Progress": "blue", Blocked: "red", Completed: "green" };

export function KanbanBoard({ cards, today }: { cards: BoardCard[]; today: string }) {
  const router = useRouter();
  const [items, setItems] = useState(cards);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<InitiativeStatus | null>(null);
  const [q, setQ] = useState("");
  const [strategy, setStrategy] = useState("");
  // Reset local (optimistic) state whenever the server sends fresh data.
  const [source, setSource] = useState(cards);
  if (source !== cards) {
    setSource(cards);
    setItems(cards);
  }

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (c) =>
        (!strategy || c.strategy === strategy) &&
        (!needle || `${c.name} ${c.owner ?? ""} ${c.sources.join(" ")} ${c.targets.join(" ")}`.toLowerCase().includes(needle)),
    );
  }, [items, q, strategy]);

  async function move(id: string, status: InitiativeStatus) {
    const previous = items;
    const card = items.find((c) => c.id === id);
    if (!card || card.status === status) return;
    setItems((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      await api("PATCH", `/api/initiatives/${id}`, { status });
      toast.success(`${card.name} → ${status}`);
      router.refresh();
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "Could not update status");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search initiatives or systems…" />
        <FilterSelect label="Strategies" value={strategy} onChange={setStrategy} options={MIGRATION_STRATEGIES} />
        <div className="sm:ml-auto">
          <NewInitiativeButton />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {INITIATIVE_STATUSES.map((status) => {
          const column = visible.filter((c) => c.status === status);
          const budget = column.reduce((s, c) => s + (c.budget ?? 0), 0);
          return (
            <section
              key={status}
              aria-label={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) move(id, status);
              }}
              className={cn(
                "flex min-h-48 flex-col gap-2 rounded-xl border bg-muted/40 p-2.5 transition-colors",
                over === status && "border-ring bg-accent",
              )}
            >
              <header className="flex items-center justify-between px-1 pb-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="size-2 rounded-full" style={{ background: TONE_VAR[COLUMN_TONE[status]] }} />
                  {status}
                  <span className="tabular rounded-md bg-card px-1.5 text-xs font-medium text-muted-foreground">{column.length}</span>
                </span>
                <span className="tabular text-xs text-muted-foreground">{formatCurrency(budget, true)}</span>
              </header>
              {column.map((c) => {
                const overdue = c.status !== "Completed" && c.targetDate && c.targetDate < today;
                return (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(c.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "group flex cursor-grab flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing",
                      dragId === c.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                      <Link href={`/transformations/${c.id}`} className="text-sm font-medium leading-snug hover:text-primary hover:underline">
                        {c.name}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <StrategyBadge value={c.strategy} />
                      <RiskLevelBadge value={c.riskLevel} />
                    </div>
                    {(c.sources.length > 0 || c.targets.length > 0) && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {c.sources.join(", ") || "—"} <span aria-label="to">→</span> {c.targets.join(", ") || "decommission"}
                      </p>
                    )}
                    {c.phasesTotal > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-[var(--status-good)]" style={{ width: `${(c.phasesDone / c.phasesTotal) * 100}%` }} />
                        </div>
                        <span className="tabular text-[11px] text-muted-foreground">
                          {c.phasesDone}/{c.phasesTotal}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-foreground")}>
                        <CalendarClock className="size-3" />
                        {formatDate(c.targetDate)}
                        {overdue && " · overdue"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="size-3" />
                        {formatCurrency(c.budget, true)}
                      </span>
                      {c.owner && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <Users className="size-3" />
                          {c.owner}
                        </span>
                      )}
                    </div>
                    <label className="sr-only" htmlFor={`status-${c.id}`}>
                      Move {c.name}
                    </label>
                    <select
                      id={`status-${c.id}`}
                      value={c.status}
                      onChange={(e) => move(c.id, e.target.value as InitiativeStatus)}
                      className="h-7 rounded-md border bg-card px-1.5 text-xs text-muted-foreground md:hidden"
                    >
                      {INITIATIVE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          Move to: {s}
                        </option>
                      ))}
                    </select>
                  </article>
                );
              })}
              {column.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted-foreground">Drop initiatives here</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
