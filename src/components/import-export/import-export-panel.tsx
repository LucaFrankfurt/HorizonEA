"use client";

import { CircleCheck, Database, Download, FileJson, FileSpreadsheet, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SeverityIcon } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label, NativeSelect } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export interface CollectionInfo {
  key: string;
  slug: string;
  label: string;
  count: number;
  columns: string[];
}

interface Report {
  mode: "merge" | "replace";
  dryRun: boolean;
  applied: boolean;
  summary: Record<string, { created: number; updated: number }>;
  errors: { resource: string; row: number; issues: Record<string, string> }[];
}

export function ImportExportPanel({ collections, allowReset }: { collections: CollectionInfo[]; allowReset: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resource, setResource] = useState(collections[0]?.slug ?? "");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [busy, setBusy] = useState<"dry" | "apply" | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isCsv = !!file && file.name.toLowerCase().endsWith(".csv");
  const labelOf = (key: string) => collections.find((c) => c.key === key || c.slug === key)?.label ?? key;

  async function runImport(dryRun: boolean) {
    if (!file) return;
    setBusy(dryRun ? "dry" : "apply");
    setError(null);
    setReport(null);
    const form = new FormData();
    form.set("file", file);
    form.set("mode", mode);
    form.set("dryRun", String(dryRun));
    if (isCsv) form.set("resource", resource);
    try {
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (res.status === 422 && data.errors) {
        setReport(data);
        toast.error(`${data.errors.length} row(s) failed validation – nothing was imported`);
      } else if (!res.ok) {
        setError(data.error ?? "Import failed");
      } else {
        setReport(data);
        if (data.applied) {
          toast.success("Import completed");
          router.refresh();
        } else toast.success("Validation passed – ready to import");
      }
    } catch {
      setError("Network error during import");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-4" /> Export
          </CardTitle>
          <CardDescription>
            A JSON snapshot contains every collection and can be re-imported as a backup. CSV files contain one collection each, with readable
            reference columns (e.g. <code>sourceApplication</code>) for reporting tools and spreadsheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-fit">
            <a href="/api/export" download>
              <FileJson /> Download full snapshot (JSON)
            </a>
          </Button>
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Collection</TH>
                <TH className="text-right">Records</TH>
                <TH className="text-right">Download</TH>
              </TR>
            </THead>
            <TBody>
              {collections.map((c) => (
                <TR key={c.slug}>
                  <TD className="font-medium">{c.label}</TD>
                  <TD className="tabular text-right text-muted-foreground">{c.count}</TD>
                  <TD className="text-right">
                    <span className="inline-flex gap-1">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/export/${c.slug}?format=csv`} download>
                          <FileSpreadsheet /> CSV
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/api/export/${c.slug}?format=json`} download>
                          JSON
                        </a>
                      </Button>
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-4" /> Import
            </CardTitle>
            <CardDescription>
              Upload a JSON snapshot or a CSV file for one collection. Rows are matched by <code>id</code>, then by natural key (e.g. name) –
              matches are updated, the rest created. Imports are all-or-nothing: if any row is invalid nothing is written.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) {
                  setFile(f);
                  setReport(null);
                }
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors hover:bg-muted/40"
            >
              <Upload className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">{file ? file.name : "Drop a .json or .csv file here, or click to browse"}</p>
              {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>}
              <input
                ref={fileRef}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setReport(null);
                  setError(null);
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cn("flex flex-col gap-1.5", !isCsv && "opacity-50")}>
                <Label htmlFor="import-resource">CSV collection</Label>
                <NativeSelect id="import-resource" value={resource} onChange={(e) => setResource(e.target.value)} disabled={!isCsv}>
                  {collections.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-1.5 text-xs font-medium">Mode</legend>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="mode" checked={mode === "merge"} onChange={() => setMode("merge")} className="accent-[var(--primary)]" />
                    Merge / upsert
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} className="accent-[var(--primary)]" />
                    Replace all
                  </label>
                </div>
              </fieldset>
            </div>
            {isCsv && (
              <p className="text-xs text-muted-foreground">
                Expected columns: <code className="break-words">{collections.find((c) => c.slug === resource)?.columns.join(", ")}</code>. References
                can be given as id or as readable name; enum values are matched case-insensitively.
              </p>
            )}
            {mode === "replace" && (
              <p className="flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--status-critical)_35%,transparent)] bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)] px-3 py-2 text-xs">
                <SeverityIcon severity="critical" className="size-4 shrink-0" />
                Replace mode deletes all existing data before importing{isCsv ? " – with a single CSV only that collection will exist afterwards" : ""}.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!file || !!busy} onClick={() => runImport(true)}>
                {busy === "dry" ? <Loader2 className="animate-spin" /> : <CircleCheck />} Validate (dry run)
              </Button>
              <Button disabled={!file || !!busy} onClick={() => runImport(false)}>
                {busy === "apply" ? <Loader2 className="animate-spin" /> : <Upload />} Import
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {report && (
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {report.errors.length
                    ? `Validation failed – ${report.errors.length} problem(s), nothing imported`
                    : report.applied
                      ? `Imported (${report.mode})`
                      : "Dry run passed – no changes written"}
                </p>
                {Object.keys(report.summary).length > 0 && (
                  <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                    {Object.entries(report.summary).map(([key, s]) => (
                      <li key={key} className="flex justify-between gap-2 rounded bg-muted/50 px-2 py-1">
                        <span>{labelOf(key)}</span>
                        <span className="tabular text-muted-foreground">
                          +{s.created} new · {s.updated} updated
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {report.errors.length > 0 && (
                  <ul className="max-h-64 overflow-y-auto text-xs">
                    {report.errors.slice(0, 100).map((e, i) => (
                      <li key={i} className="border-b py-1 last:border-0">
                        <span className="font-medium">
                          {labelOf(e.resource)} row {e.row}:
                        </span>{" "}
                        {Object.entries(e.issues)
                          .map(([field, msg]) => `${field} – ${msg}`)
                          .join("; ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {allowReset && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4" /> Demo data
              </CardTitle>
              <CardDescription>Restore the sample landscape, or start from an empty repository.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <ConfirmAction
                trigger={
                  <Button variant="outline">
                    <RotateCcw /> Reset to demo data
                  </Button>
                }
                title="Reset to demo data?"
                description="All current data is replaced by the demo landscape. Export a snapshot first if you want to keep it."
                url="/api/demo-data"
                success="Demo data loaded"
              />
              <ConfirmAction
                trigger={
                  <Button variant="outline">
                    <Trash2 /> Clear all data
                  </Button>
                }
                title="Delete all data?"
                description="Every application, technology, asset, relationship and initiative is permanently deleted."
                url="/api/demo-data?empty=1"
                success="Repository cleared"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ConfirmAction({ trigger, title, description, url, success }: { trigger: React.ReactNode; title: string; description: string; url: string; success: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("POST", url);
                toast.success(success);
                setOpen(false);
                router.refresh();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="animate-spin" />} Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
