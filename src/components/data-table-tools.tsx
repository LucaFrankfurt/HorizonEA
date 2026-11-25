"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input, NativeSelect } from "@/components/ui/input";
import { TH } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

export function useSort<T>(rows: T[], initial: { key: string; dir: SortDir }, accessors: Record<string, (row: T) => string | number | null>) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const get = accessors[sort.key];
    if (!get) return rows;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va === vb) return 0;
      if (va === null || va === "") return 1;
      if (vb === null || vb === "") return -1;
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const toggle = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  return { sorted, sort, toggle };
}

export function SortableTH({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  sort: { key: string; dir: SortDir };
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TH className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
      <button onClick={() => onSort(sortKey)} className="inline-flex cursor-pointer items-center gap-1 uppercase hover:text-foreground">
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} />
      </button>
    </TH>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "Search…"} className="pl-8" aria-label="Search" />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="w-full sm:w-auto sm:min-w-36">
      <option value="">All {label.toLowerCase()}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </NativeSelect>
  );
}
