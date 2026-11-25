"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EolBadge, StandardBadge } from "@/components/badges";
import { FilterSelect, SearchInput, SortableTH, useSort } from "@/components/data-table-tools";
import { EmptyState } from "@/components/layout/page-header";
import { TONE_VAR } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, THead, TR } from "@/components/ui/table";
import { formatDate, relativeFromToday } from "@/lib/dates";
import { STANDARDIZATION_STATUSES, TECH_CATEGORIES } from "@/lib/domain";
import type { Technology } from "@/lib/db/schema";
import { EOL_STATUS_META, type EolStatus } from "@/lib/risk";
import { cn } from "@/lib/utils";
import { NewTechnologyButton } from "./technology-actions";

export interface TechnologyRow extends Technology {
  eol: EolStatus;
  usedBy: number;
  hosts: number;
}

const STATUS_ORDER: EolStatus[] = ["expired", "extended", "within6", "within12", "supported", "unknown"];

export function TechnologiesTable({ rows, today, vendors }: { rows: TechnologyRow[]; today: string; vendors: string[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [standard, setStandard] = useState("");
  const [eol, setEol] = useState<EolStatus | "">("");
  const [inUseOnly, setInUseOnly] = useState(false);

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<EolStatus, number>;
    for (const r of rows) c[r.eol]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!needle || `${r.name} ${r.version} ${r.vendor ?? ""}`.toLowerCase().includes(needle)) &&
        (!category || r.category === category) &&
        (!standard || r.standardizationStatus === standard) &&
        (!eol || r.eol === eol) &&
        (!inUseOnly || r.usedBy + r.hosts > 0),
    );
  }, [rows, q, category, standard, eol, inUseOnly]);

  const { sorted, sort, toggle } = useSort(filtered, { key: "eolDate", dir: "asc" }, {
    name: (r) => `${r.name} ${r.version}`.toLowerCase(),
    category: (r) => r.category,
    standard: (r) => STANDARDIZATION_STATUSES.indexOf(r.standardizationStatus),
    eolDate: (r) => r.eolDate,
    ext: (r) => r.extendedSupportEndDate,
    usage: (r) => -(r.usedBy + r.hosts),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setEol(eol === s ? "" : s)}
            aria-pressed={eol === s}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-1 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
              eol === s && "ring-2 ring-ring/50",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: TONE_VAR[EOL_STATUS_META[s].tone] }} />
              {EOL_STATUS_META[s].label}
            </span>
            <span className="tabular text-xl font-semibold">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search technologies…" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterSelect label="Categories" value={category} onChange={setCategory} options={TECH_CATEGORIES} />
          <FilterSelect label="Standards" value={standard} onChange={setStandard} options={STANDARDIZATION_STATUSES} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={inUseOnly} onChange={(e) => setInUseOnly(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          In use only
        </label>
        <div className="lg:ml-auto">
          <NewTechnologyButton vendors={vendors} />
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No technologies match" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <SortableTH label="Technology" sortKey="name" sort={sort} onSort={toggle} />
                <SortableTH label="Category" sortKey="category" sort={sort} onSort={toggle} className="hidden md:table-cell" />
                <SortableTH label="Standard" sortKey="standard" sort={sort} onSort={toggle} />
                <SortableTH label="Official EOL" sortKey="eolDate" sort={sort} onSort={toggle} />
                <SortableTH label="Extended support" sortKey="ext" sort={sort} onSort={toggle} className="hidden lg:table-cell" />
                <SortableTH label="Used by" sortKey="usage" sort={sort} onSort={toggle} className="text-right" />
              </TR>
            </THead>
            <TBody>
              {sorted.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/technologies/${r.id}`} className="font-medium hover:text-primary hover:underline">
                      {r.name} <span className="text-muted-foreground">{r.version}</span>
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.vendor}</p>
                  </TD>
                  <TD className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{r.category}</TD>
                  <TD>
                    <StandardBadge value={r.standardizationStatus} />
                  </TD>
                  <TD className="whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <span className="tabular text-xs">
                        {formatDate(r.eolDate)}
                        {r.eolDate && <span className="text-muted-foreground"> · {relativeFromToday(r.eolDate, today)}</span>}
                      </span>
                      <EolBadge status={r.eol} />
                    </div>
                  </TD>
                  <TD className="tabular hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                    {formatDate(r.extendedSupportEndDate)}
                  </TD>
                  <TD className="tabular whitespace-nowrap text-right text-xs">
                    {r.usedBy > 0 ? `${r.usedBy} app${r.usedBy === 1 ? "" : "s"}` : <span className="text-muted-foreground">—</span>}
                    {r.hosts > 0 && <span className="block text-muted-foreground">{r.hosts} host{r.hosts === 1 ? "" : "s"}</span>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
