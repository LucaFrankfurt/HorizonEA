"use client";

import { ArrowLeftRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DeltaBadge, StateBadge } from "@/components/badges";
import { DeleteButton } from "@/components/forms/delete-button";
import type { Option } from "@/components/forms/entity-form";
import { useViewMode } from "@/components/layout/view-mode";
import { interfaceDelta, visibleInMode } from "@/lib/delta";
import type { Interface } from "@/lib/db/schema";
import { EditInterface } from "./application-actions";

export interface InterfaceRow extends Interface {
  partnerId: string;
  partnerName: string;
  outbound: boolean;
}

export function InterfaceList({ rows, applications }: { rows: InterfaceRow[]; applications: Option[] }) {
  const { mode } = useViewMode();
  const visible = rows.filter((r) => visibleInMode(r.architectureState, mode));
  if (!visible.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No interfaces in this architecture state.</p>;
  }
  const groups = [
    { title: "Outbound (provides data to)", items: visible.filter((r) => r.outbound) },
    { title: "Inbound (consumes data from)", items: visible.filter((r) => !r.outbound) },
  ];
  return (
    <div className="flex flex-col gap-4">
      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.title}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</p>
              <ul className="divide-y rounded-lg border">
                {g.items.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1.5 text-sm">
                        {r.direction === "Bidirectional" ? (
                          <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ArrowRight className={`size-3.5 shrink-0 text-muted-foreground ${r.outbound ? "" : "rotate-180"}`} />
                        )}
                        <Link href={`/applications/${r.partnerId}`} className="truncate font-medium hover:text-primary hover:underline">
                          {r.partnerName}
                        </Link>
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {r.name} · {r.integrationPattern}
                        {r.protocol ? ` · ${r.protocol}` : ""}
                        {r.dataFlow ? ` · ${r.dataFlow}` : ""}
                      </span>
                    </span>
                    {mode === "delta" ? <DeltaBadge status={interfaceDelta(r)} /> : <StateBadge value={r.architectureState} />}
                    <span className="flex">
                      <EditInterface iface={r} applications={applications} />
                      <DeleteButton url={`/api/interfaces/${r.id}`} name={`interface "${r.name}"`} compact />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}
    </div>
  );
}
