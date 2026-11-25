"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CriticalityBadge, DeltaBadge, EolBadge, LifecycleBadge, RiskBadge, StateBadge } from "@/components/badges";
import { FilterSelect, SearchInput, SortableTH, useSort } from "@/components/data-table-tools";
import { EntityFormDialog } from "@/components/forms/entity-form";
import { applicationFields } from "@/components/forms/fields";
import { useViewMode } from "@/components/layout/view-mode";
import { EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { DELTA_META, visibleInMode, type DeltaStatus } from "@/lib/delta";
import { CRITICALITIES, HOSTING_MODELS, LIFECYCLE_STATUSES } from "@/lib/domain";
import type { Application } from "@/lib/db/schema";
import { eolStatus, SEVERITY_ORDER, type RiskLevel } from "@/lib/risk";

export interface ApplicationRow extends Application {
  riskLevel: RiskLevel;
  riskScore: number;
  delta: DeltaStatus;
  techCount: number;
  interfaceCount: number;
}

export function ApplicationsTable({ rows, domains, today }: { rows: ApplicationRow[]; domains: string[]; today: string }) {
  const { mode } = useViewMode();
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [criticality, setCriticality] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [hosting, setHosting] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        visibleInMode(r.architectureState, mode) &&
        (!needle || `${r.name} ${r.description ?? ""} ${r.owner ?? ""}`.toLowerCase().includes(needle)) &&
        (!domain || r.businessDomain === domain) &&
        (!criticality || r.criticality === criticality) &&
        (!lifecycle || r.lifecycleStatus === lifecycle) &&
        (!hosting || r.hostingModel === hosting),
    );
  }, [rows, mode, q, domain, criticality, lifecycle, hosting]);

  const { sorted, sort, toggle } = useSort(filtered, { key: "name", dir: "asc" }, {
    name: (r) => r.name.toLowerCase(),
    domain: (r) => r.businessDomain,
    criticality: (r) => r.criticality,
    lifecycle: (r) => LIFECYCLE_STATUSES.indexOf(r.lifecycleStatus),
    eol: (r) => r.plannedEolDate,
    risk: (r) => -(SEVERITY_ORDER[r.riskLevel] * 1000 + r.riskScore),
    delta: (r) => ["new", "modified", "removed", "unchanged"].indexOf(r.delta),
  });

  const deltaCounts = useMemo(() => {
    const counts: Record<DeltaStatus, number> = { new: 0, modified: 0, removed: 0, unchanged: 0 };
    for (const r of filtered) counts[r.delta]++;
    return counts;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search applications…" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterSelect label="Domains" value={domain} onChange={setDomain} options={domains} />
          <FilterSelect label="Criticalities" value={criticality} onChange={setCriticality} options={CRITICALITIES} />
          <FilterSelect label="Lifecycles" value={lifecycle} onChange={setLifecycle} options={LIFECYCLE_STATUSES} />
          <FilterSelect label="Hosting models" value={hosting} onChange={setHosting} options={HOSTING_MODELS} />
        </div>
        <div className="lg:ml-auto">
          <EntityFormDialog
            trigger={
              <Button>
                <Plus /> New application
              </Button>
            }
            title="New application"
            fields={applicationFields(domains)}
            endpoint="/api/applications"
            initial={{ architectureState: mode === "to-be" ? "To-Be" : "Both", lifecycleStatus: "Active", criticality: "Tier 2" }}
            wide
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Showing <span className="tabular font-medium text-foreground">{sorted.length}</span> of {rows.length} applications
          {mode !== "delta" && <> in the {mode === "as-is" ? "current (As-Is)" : "target (To-Be)"} state</>}
        </span>
        {mode === "delta" &&
          (Object.keys(deltaCounts) as DeltaStatus[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1">
              · <DeltaBadge status={k} /> <span className="tabular">{deltaCounts[k]}</span>
            </span>
          ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No applications match" description="Adjust the filters or the architecture state switcher." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <SortableTH label="Application" sortKey="name" sort={sort} onSort={toggle} />
                <SortableTH label="Domain" sortKey="domain" sort={sort} onSort={toggle} />
                <SortableTH label="Criticality" sortKey="criticality" sort={sort} onSort={toggle} />
                <SortableTH label="Lifecycle" sortKey="lifecycle" sort={sort} onSort={toggle} />
                {mode === "delta" ? (
                  <SortableTH label="Delta" sortKey="delta" sort={sort} onSort={toggle} />
                ) : (
                  <TH>State</TH>
                )}
                <TH className="hidden xl:table-cell">Hosting</TH>
                <SortableTH label="Planned EOL" sortKey="eol" sort={sort} onSort={toggle} className="hidden md:table-cell" />
                <SortableTH label="Risk" sortKey="risk" sort={sort} onSort={toggle} />
              </TR>
            </THead>
            <TBody>
              {sorted.map((r) => {
                const eol = r.plannedEolDate ? eolStatus(r.plannedEolDate, today) : null;
                return (
                  <TR key={r.id}>
                    <TD className="max-w-80">
                      <Link href={`/applications/${r.id}`} className="font-medium hover:text-primary hover:underline">
                        {r.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{r.owner ?? r.description}</p>
                    </TD>
                    <TD className="whitespace-nowrap text-muted-foreground">{r.businessDomain}</TD>
                    <TD>
                      <CriticalityBadge value={r.criticality} />
                    </TD>
                    <TD>
                      <LifecycleBadge value={r.lifecycleStatus} />
                    </TD>
                    <TD>{mode === "delta" ? <DeltaBadge status={r.delta} /> : <StateBadge value={r.architectureState} />}</TD>
                    <TD className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{r.hostingModel}</TD>
                    <TD className="hidden whitespace-nowrap md:table-cell">
                      <div className="flex flex-col items-start gap-1">
                        <span className="tabular text-xs">{formatDate(r.plannedEolDate)}</span>
                        {eol && (eol === "expired" || eol === "within6" || eol === "within12") && r.lifecycleStatus !== "Retired" && (
                          <EolBadge status={eol} label={eol === "expired" ? "Overdue" : undefined} />
                        )}
                      </div>
                    </TD>
                    <TD>
                      <RiskBadge level={r.riskLevel} score={r.riskScore} />
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
      {mode === "delta" && (
        <p className="text-xs text-muted-foreground">
          {(Object.keys(DELTA_META) as DeltaStatus[]).map((k) => `${DELTA_META[k].label}: ${DELTA_META[k].description}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
