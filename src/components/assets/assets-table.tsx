"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EolBadge } from "@/components/badges";
import { FilterSelect, SearchInput, SortableTH, useSort } from "@/components/data-table-tools";
import type { Option } from "@/components/forms/entity-form";
import { EmptyState } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { ASSET_TYPES, ENVIRONMENTS } from "@/lib/domain";
import type { Asset } from "@/lib/db/schema";
import type { EolStatus } from "@/lib/risk";
import { NewAssetButton } from "./asset-actions";

export interface AssetRow extends Asset {
  platform: string | null;
  platformEol: EolStatus | null;
  hardwareEol: EolStatus;
  hosted: number;
}

export function AssetsTable({
  rows,
  platforms,
  locations,
  owners,
}: {
  rows: AssetRow[];
  platforms: Option[];
  locations: string[];
  owners: string[];
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [env, setEnv] = useState("");
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!needle || `${r.name} ${r.owner ?? ""} ${r.platform ?? ""} ${r.description ?? ""}`.toLowerCase().includes(needle)) &&
        (!type || r.assetType === type) &&
        (!env || r.environment === env) &&
        (!location || r.location === location),
    );
  }, [rows, q, type, env, location]);

  const { sorted, sort, toggle } = useSort(filtered, { key: "name", dir: "asc" }, {
    name: (r) => r.name.toLowerCase(),
    type: (r) => r.assetType,
    env: (r) => ENVIRONMENTS.indexOf(r.environment),
    location: (r) => r.location,
    eol: (r) => r.eolDate,
    hosted: (r) => -r.hosted,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search assets…" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterSelect label="Types" value={type} onChange={setType} options={ASSET_TYPES} />
          <FilterSelect label="Environments" value={env} onChange={setEnv} options={ENVIRONMENTS} />
          <FilterSelect label="Locations" value={location} onChange={setLocation} options={locations} />
        </div>
        <div className="lg:ml-auto">
          <NewAssetButton platforms={platforms} locations={locations} owners={owners} />
        </div>
      </div>
      {sorted.length === 0 ? (
        <EmptyState title="No assets match" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <SortableTH label="Asset" sortKey="name" sort={sort} onSort={toggle} />
                <SortableTH label="Type" sortKey="type" sort={sort} onSort={toggle} />
                <SortableTH label="Env" sortKey="env" sort={sort} onSort={toggle} />
                <SortableTH label="Location" sortKey="location" sort={sort} onSort={toggle} className="hidden lg:table-cell" />
                <TH>OS / platform</TH>
                <SortableTH label="Hardware EOL" sortKey="eol" sort={sort} onSort={toggle} className="hidden md:table-cell" />
                <SortableTH label="Hosts" sortKey="hosted" sort={sort} onSort={toggle} className="text-right" />
              </TR>
            </THead>
            <TBody>
              {sorted.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/assets/${r.id}`} className="font-medium hover:text-primary hover:underline">
                      {r.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.owner}</p>
                  </TD>
                  <TD className="whitespace-nowrap text-muted-foreground">{r.assetType}</TD>
                  <TD className="text-muted-foreground">{r.environment}</TD>
                  <TD className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{r.location ?? "—"}</TD>
                  <TD>
                    {r.platform ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="whitespace-nowrap text-xs">{r.platform}</span>
                        {r.platformEol && r.platformEol !== "supported" && r.platformEol !== "unknown" && <EolBadge status={r.platformEol} />}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TD>
                  <TD className="hidden whitespace-nowrap md:table-cell">
                    <div className="flex flex-col items-start gap-1">
                      <span className="tabular text-xs">{formatDate(r.eolDate)}</span>
                      {r.hardwareEol !== "supported" && r.hardwareEol !== "unknown" && <EolBadge status={r.hardwareEol} />}
                    </div>
                  </TD>
                  <TD className="tabular text-right text-xs">{r.hosted || <span className="text-muted-foreground">—</span>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
