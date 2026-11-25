"use client";

import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Cpu, ExternalLink, Server, X } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CriticalityBadge, DeltaBadge, LifecycleBadge, RiskBadge, SeverityIcon, StateBadge } from "@/components/badges";
import { FilterSelect } from "@/components/data-table-tools";
import { useViewMode } from "@/components/layout/view-mode";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { DELTA_META, interfaceDelta, visibleInMode, type DeltaStatus } from "@/lib/delta";
import { CRITICALITIES, LIFECYCLE_STATUSES, type ArchitectureState } from "@/lib/domain";
import { EOL_STATUS_META, RISK_META, type EolStatus, type RiskLevel } from "@/lib/risk";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data contracts (prepared on the server)
// ---------------------------------------------------------------------------
export interface MapApp {
  id: string;
  name: string;
  businessDomain: string;
  criticality: string;
  lifecycleStatus: string;
  architectureState: ArchitectureState;
  hostingModel: string;
  riskLevel: RiskLevel;
  riskScore: number;
  delta: DeltaStatus;
  findings: { severity: RiskLevel; message: string }[];
}
export interface MapInterface {
  id: string;
  name: string;
  source: string;
  target: string;
  protocol: string | null;
  pattern: string;
  direction: string;
  state: ArchitectureState;
  dataFlow: string | null;
}
export interface MapTech {
  id: string;
  label: string;
  category: string;
  eol: EolStatus;
  standard: string;
}
export interface MapAsset {
  id: string;
  name: string;
  type: string;
  environment: string;
}
export interface LandscapeData {
  apps: MapApp[];
  interfaces: MapInterface[];
  technologies: MapTech[];
  assets: MapAsset[];
  appTech: [string, string][];
  appAssets: [string, string][];
  domains: string[]; // ordered by size – drives the fixed categorical colour order
}

type ColorBy = "domain" | "risk" | "lifecycle" | "criticality";

const SERIES = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);
const RISK_COLOR: Record<RiskLevel, string> = {
  critical: "var(--status-critical)",
  high: "var(--status-serious)",
  medium: "var(--status-warning)",
  low: "var(--status-info)",
  none: "var(--status-good)",
};
const LIFECYCLE_COLOR: Record<string, string> = {
  Planned: "var(--status-info)",
  Active: "var(--status-good)",
  "Phase-Out": "var(--status-warning)",
  Retired: "var(--status-neutral)",
};
const CRITICALITY_COLOR: Record<string, string> = { "Tier 1": "var(--series-7)", "Tier 2": "var(--series-1)", "Tier 3": "var(--status-neutral)" };
const DELTA_COLOR: Record<DeltaStatus, string> = {
  new: "var(--status-good)",
  removed: "var(--status-critical)",
  modified: "var(--status-warning)",
  unchanged: "var(--status-neutral)",
};
const EOL_COLOR: Record<EolStatus, string> = {
  expired: "var(--status-critical)",
  extended: "var(--status-serious)",
  within6: "var(--status-warning)",
  within12: "var(--status-mild)",
  supported: "var(--status-good)",
  unknown: "var(--status-neutral)",
};

const APP_W = 210;
const APP_H = 64;
const SMALL_W = 170;
const SMALL_H = 34;

// ---------------------------------------------------------------------------
// Custom nodes
// ---------------------------------------------------------------------------
type AppNodeData = { app: MapApp; color: string; delta: boolean; dimmed: boolean };
type SmallNodeData = { label: string; sublabel: string; color: string; kind: "tech" | "asset"; dimmed: boolean };

function AppNode({ data, selected }: NodeProps<Node<AppNodeData, "app">>) {
  const { app, color, delta, dimmed } = data;
  const removed = delta && app.delta === "removed";
  return (
    <div
      className={cn(
        "relative flex h-[64px] w-[210px] flex-col justify-center gap-1 rounded-lg border bg-card px-3 py-2 shadow-sm transition-opacity",
        selected && "ring-2 ring-ring",
        dimmed && "opacity-25",
      )}
      style={{
        borderColor: delta ? color : undefined,
        borderWidth: delta ? 2 : 1,
        borderStyle: removed ? "dashed" : "solid",
        borderLeftWidth: delta ? 2 : 5,
        borderLeftColor: color,
      }}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-[var(--axis)]" />
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[13px] font-semibold leading-tight" title={app.name}>
          {app.name}
        </span>
        {app.riskLevel !== "none" && <SeverityIcon severity={app.riskLevel} className="ml-auto size-3.5 shrink-0" />}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="truncate">{app.businessDomain}</span>
        <span>·</span>
        <span className="shrink-0">{app.criticality}</span>
        {delta && (
          <span className="ml-auto shrink-0 rounded px-1 font-medium text-foreground" style={{ background: `color-mix(in oklab, ${color} 18%, transparent)` }}>
            {DELTA_META[app.delta].label}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-[var(--axis)]" />
    </div>
  );
}

function SmallNode({ data, selected }: NodeProps<Node<SmallNodeData, "small">>) {
  const Icon = data.kind === "tech" ? Cpu : Server;
  return (
    <div
      className={cn(
        "flex h-[34px] w-[170px] items-center gap-2 rounded-full border bg-muted px-3 text-[11px] shadow-xs transition-opacity",
        selected && "ring-2 ring-ring",
        data.dimmed && "opacity-25",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-1 !border-0 !bg-transparent" />
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate" title={data.label}>
        {data.label}
      </span>
      <span className="size-2 shrink-0 rounded-full" style={{ background: data.color }} title={data.sublabel} />
    </div>
  );
}

function LaneNode({ data }: NodeProps<Node<{ label: string }, "lane">>) {
  return (
    <div className="pointer-events-none h-full w-full rounded-xl border bg-muted/50 px-3.5 py-2.5 text-xs font-semibold text-muted-foreground">
      {data.label}
    </div>
  );
}

const nodeTypes = { app: AppNode, small: SmallNode, lane: LaneNode };

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function dagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 18, ranksep: 80, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: n.type === "app" ? APP_W : SMALL_W, height: n.type === "app" ? APP_H : SMALL_H });
  for (const e of edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    const w = n.type === "app" ? APP_W : SMALL_W;
    const h = n.type === "app" ? APP_H : SMALL_H;
    return { ...n, position: { x: p.x - w / 2, y: p.y - h / 2 } };
  });
}

/** Domain lanes: one column per business domain, infrastructure columns on the right. */
function laneLayout(nodes: Node[], apps: Map<string, MapApp>, domains: string[]) {
  const colW = APP_W + 70;
  const byColumn = new Map<string, Node[]>();
  for (const n of nodes) {
    const key = n.type === "app" ? apps.get(n.id)!.businessDomain : n.id.startsWith("tech:") ? "~Technologies" : "~Assets";
    byColumn.set(key, [...(byColumn.get(key) ?? []), n]);
  }
  const columns = [...domains.filter((d) => byColumn.has(d)), ...["~Technologies", "~Assets"].filter((c) => byColumn.has(c))];
  const laid: Node[] = [];
  columns.forEach((col, ci) => {
    const items = byColumn.get(col)!;
    const nameOf = (n: Node) => (n.type === "app" ? (n.data as AppNodeData).app.name : (n.data as SmallNodeData).label);
    items.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    laid.push({
      id: `lane:${col}`,
      type: "lane",
      position: { x: ci * colW - 14, y: -48 },
      data: { label: col.replace("~", "") },
      style: { width: colW - 42, height: items.length * (APP_H + 16) + 64 },
      selectable: false,
      draggable: false,
      focusable: false,
      zIndex: -1,
    });
    items.forEach((n, i) => {
      const w = n.type === "app" ? APP_W : SMALL_W;
      laid.push({ ...n, position: { x: ci * colW + (APP_W - w) / 2, y: i * (APP_H + 16) } });
    });
  });
  return laid;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type Selection = { type: "app"; id: string } | { type: "interface"; id: string } | null;

function MapInner({ data }: { data: LandscapeData }) {
  const { mode } = useViewMode();
  const { resolvedTheme } = useTheme();
  const { fitView } = useReactFlow();
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [criticality, setCriticality] = useState("");
  const [lifecycle, setLifecycle] = useState("operational");
  const [colorBy, setColorBy] = useState<ColorBy>("domain");
  const [layout, setLayout] = useState<"flow" | "lanes">("flow");
  const [showTech, setShowTech] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [riskOnly, setRiskOnly] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);

  const appById = useMemo(() => new Map(data.apps.map((a) => [a.id, a])), [data.apps]);
  const domainColor = useMemo(() => new Map(data.domains.map((d, i) => [d, SERIES[i] ?? "var(--status-neutral)"])), [data.domains]);

  const colorFor = (app: MapApp) => {
    if (mode === "delta") return DELTA_COLOR[app.delta];
    switch (colorBy) {
      case "risk":
        return RISK_COLOR[app.riskLevel];
      case "lifecycle":
        return LIFECYCLE_COLOR[app.lifecycleStatus];
      case "criticality":
        return CRITICALITY_COLOR[app.criticality];
      default:
        return domainColor.get(app.businessDomain) ?? "var(--status-neutral)";
    }
  };

  const { nodes, edges, counts } = useMemo(() => {
    const visibleApps = data.apps.filter(
      (a) =>
        visibleInMode(a.architectureState, mode) &&
        (!domain || a.businessDomain === domain) &&
        (!criticality || a.criticality === criticality) &&
        (lifecycle === "" || (lifecycle === "operational" ? a.lifecycleStatus !== "Retired" : a.lifecycleStatus === lifecycle)) &&
        (!riskOnly || a.riskLevel === "critical" || a.riskLevel === "high"),
    );
    const ids = new Set(visibleApps.map((a) => a.id));
    const ifaces = data.interfaces.filter((i) => visibleInMode(i.state, mode) && ids.has(i.source) && ids.has(i.target));

    const neighbours = new Set<string>();
    if (selection?.type === "app") {
      neighbours.add(selection.id);
      for (const i of ifaces) {
        if (i.source === selection.id) neighbours.add(i.target);
        if (i.target === selection.id) neighbours.add(i.source);
      }
      for (const [a, t] of data.appTech) if (a === selection.id) neighbours.add(`tech:${t}`);
      for (const [a, s] of data.appAssets) if (a === selection.id) neighbours.add(`asset:${s}`);
    }
    const dim = (id: string) => selection?.type === "app" && !neighbours.has(id);

    const nodes: Node[] = visibleApps.map((app) => ({
      id: app.id,
      type: "app",
      position: { x: 0, y: 0 },
      data: { app, color: colorFor(app), delta: mode === "delta", dimmed: dim(app.id) } satisfies AppNodeData,
    }));
    const edges: Edge[] = ifaces.map((i) => {
      const status = interfaceDelta({ architectureState: i.state });
      const stroke = mode === "delta" ? DELTA_COLOR[status] : i.pattern === "Event Streaming" ? "var(--series-7)" : "var(--axis)";
      const active = selection?.type === "interface" ? selection.id === i.id : selection?.type === "app" ? i.source === selection.id || i.target === selection.id : false;
      const faded = selection !== null && !active;
      return {
        id: i.id,
        source: i.source,
        target: i.target,
        type: "smoothstep",
        label: showLabels || active ? i.name : undefined,
        animated: i.pattern === "Event Streaming" || i.pattern === "Asynchronous Messaging",
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        markerStart: i.direction === "Bidirectional" ? { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 } : undefined,
        style: {
          stroke,
          strokeWidth: active ? 2.5 : mode === "delta" && status !== "unchanged" ? 2 : 1.5,
          strokeDasharray: mode === "delta" && status === "removed" ? "6 4" : undefined,
          opacity: faded ? 0.15 : 1,
        },
        data: { interface: i },
      };
    });

    if (showTech) {
      const techIds = new Set<string>();
      for (const [a, t] of data.appTech) {
        if (!ids.has(a)) continue;
        techIds.add(t);
        edges.push({
          id: `at:${a}:${t}`,
          source: a,
          target: `tech:${t}`,
          type: "default",
          style: { stroke: "var(--axis)", strokeDasharray: "3 3", opacity: selection?.type === "app" && selection.id !== a ? 0.1 : 0.7 },
          selectable: false,
        });
      }
      for (const t of data.technologies) {
        if (!techIds.has(t.id)) continue;
        nodes.push({
          id: `tech:${t.id}`,
          type: "small",
          position: { x: 0, y: 0 },
          data: { label: t.label, sublabel: `${EOL_STATUS_META[t.eol].label} · ${t.standard}`, color: EOL_COLOR[t.eol], kind: "tech", dimmed: dim(`tech:${t.id}`) } satisfies SmallNodeData,
        });
      }
    }
    if (showAssets) {
      const assetIds = new Set<string>();
      for (const [a, s] of data.appAssets) {
        if (!ids.has(a)) continue;
        assetIds.add(s);
        edges.push({
          id: `aa:${a}:${s}`,
          source: a,
          target: `asset:${s}`,
          type: "default",
          style: { stroke: "var(--axis)", strokeDasharray: "1 3", opacity: selection?.type === "app" && selection.id !== a ? 0.1 : 0.7 },
          selectable: false,
        });
      }
      for (const s of data.assets) {
        if (!assetIds.has(s.id)) continue;
        nodes.push({
          id: `asset:${s.id}`,
          type: "small",
          position: { x: 0, y: 0 },
          data: { label: s.name, sublabel: `${s.type} · ${s.environment}`, color: "var(--status-neutral)", kind: "asset", dimmed: dim(`asset:${s.id}`) } satisfies SmallNodeData,
        });
      }
    }

    const laid = layout === "flow" ? dagreLayout(nodes, edges) : laneLayout(nodes, appById, data.domains);
    return { nodes: laid, edges, counts: { apps: visibleApps.length, interfaces: ifaces.length } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode, domain, criticality, lifecycle, riskOnly, colorBy, layout, showTech, showAssets, showLabels, selection, appById]);

  // Re-fit when the visible graph changes shape (not on selection).
  const shapeKey = `${mode}|${domain}|${criticality}|${lifecycle}|${riskOnly}|${layout}|${showTech}|${showAssets}`;
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.08, maxZoom: 1.1, duration: 300 }), 50);
    return () => clearTimeout(t);
  }, [shapeKey, fitView]);

  const legend: { label: string; color: string }[] =
    mode === "delta"
      ? (Object.keys(DELTA_META) as DeltaStatus[]).map((k) => ({ label: DELTA_META[k].label, color: DELTA_COLOR[k] }))
      : colorBy === "risk"
        ? (Object.keys(RISK_META) as RiskLevel[]).map((k) => ({ label: RISK_META[k].label, color: RISK_COLOR[k] }))
        : colorBy === "lifecycle"
          ? LIFECYCLE_STATUSES.map((k) => ({ label: k, color: LIFECYCLE_COLOR[k] }))
          : colorBy === "criticality"
            ? CRITICALITIES.map((k) => ({ label: k, color: CRITICALITY_COLOR[k] }))
            : data.domains.map((d, i) => ({ label: i < 8 ? d : `${d} (other)`, color: domainColor.get(d)! }));

  const selectedApp = selection?.type === "app" ? appById.get(selection.id) : undefined;
  const selectedIface = selection?.type === "interface" ? data.interfaces.find((i) => i.id === selection.id) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterSelect label="Domains" value={domain} onChange={setDomain} options={data.domains} />
          <FilterSelect label="Criticalities" value={criticality} onChange={setCriticality} options={CRITICALITIES} />
          <NativeSelect value={lifecycle} onChange={(e) => setLifecycle(e.target.value)} aria-label="Lifecycle" className="w-full sm:w-auto">
            <option value="operational">All except retired</option>
            <option value="">All lifecycles</option>
            {LIFECYCLE_STATUSES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value as ColorBy)}
            aria-label="Colour by"
            disabled={mode === "delta"}
            className="w-full sm:w-auto"
            title={mode === "delta" ? "Delta view colours by change type" : undefined}
          >
            <option value="domain">Colour: business domain</option>
            <option value="risk">Colour: risk level</option>
            <option value="lifecycle">Colour: lifecycle</option>
            <option value="criticality">Colour: criticality</option>
          </NativeSelect>
          <NativeSelect value={layout} onChange={(e) => setLayout(e.target.value as "flow" | "lanes")} aria-label="Layout" className="w-full sm:w-auto">
            <option value="flow">Layout: data flow</option>
            <option value="lanes">Layout: domain lanes</option>
          </NativeSelect>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {[
            ["Technologies", showTech, setShowTech],
            ["IT assets", showAssets, setShowAssets],
            ["Interface labels", showLabels, setShowLabels],
            ["High risk only", riskOnly, setRiskOnly],
          ].map(([label, value, set]) => (
            <label key={label as string} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={value as boolean}
                onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
              />
              {label as string}
            </label>
          ))}
        </div>
      </div>

      <div className="relative h-[calc(100dvh-14rem)] min-h-[520px] overflow-hidden rounded-xl border bg-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          fitView
          fitViewOptions={{ padding: 0.08, maxZoom: 1.1 }}
          minZoom={0.15}
          maxZoom={2}
          nodesConnectable={false}
          onNodeClick={(_, node) => {
            if (node.type === "app") setSelection({ type: "app", id: node.id });
            else if (node.id.startsWith("tech:")) router.push(`/technologies/${node.id.slice(5)}`);
            else if (node.id.startsWith("asset:")) router.push(`/assets/${node.id.slice(6)}`);
          }}
          onEdgeClick={(_, edge) => edge.data?.interface && setSelection({ type: "interface", id: edge.id })}
          onPaneClick={() => setSelection(null)}
        >
          <Background gap={20} size={1} color="var(--grid)" />
          <Controls showInteractive={false} />

          <Panel position="top-right">
            <div className="flex max-w-[260px] flex-col gap-1 rounded-lg border bg-card/95 p-2.5 text-[11px] shadow-sm backdrop-blur">
              <span className="font-semibold text-muted-foreground">
                {counts.apps} applications · {counts.interfaces} interfaces
              </span>
              {legend.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-1 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
              <span className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <svg width="22" height="6" aria-hidden>
                  <line x1="0" y1="3" x2="22" y2="3" stroke="var(--series-7)" strokeWidth="2" strokeDasharray="5 3" />
                </svg>
                Async / event flow (animated)
              </span>
            </div>
          </Panel>
        </ReactFlow>

        {(selectedApp || selectedIface) && (
          <aside className="absolute inset-y-3 right-3 z-10 flex w-[min(340px,calc(100%-1.5rem))] flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-4 shadow-xl">
            <button onClick={() => setSelection(null)} className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close details">
              <X className="size-4" />
            </button>
            {selectedApp && (
              <>
                <div className="pr-6">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{selectedApp.businessDomain}</p>
                  <h3 className="text-base font-semibold">{selectedApp.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  <CriticalityBadge value={selectedApp.criticality} />
                  <LifecycleBadge value={selectedApp.lifecycleStatus} />
                  <StateBadge value={selectedApp.architectureState} />
                  {mode === "delta" && <DeltaBadge status={selectedApp.delta} />}
                  <RiskBadge level={selectedApp.riskLevel} score={selectedApp.riskScore} />
                </div>
                {selectedApp.findings.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {selectedApp.findings.map((f, i) => (
                      <li key={i} className="flex gap-2 text-xs">
                        <SeverityIcon severity={f.severity} className="mt-px size-3.5 shrink-0" />
                        {f.message}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Interfaces in this view</p>
                  {edges
                    .filter((e) => e.data?.interface && (e.source === selectedApp.id || e.target === selectedApp.id))
                    .map((e) => {
                      const i = e.data!.interface as MapInterface;
                      const outbound = i.source === selectedApp.id;
                      return (
                        <p key={i.id}>
                          {outbound ? "→" : "←"} {appById.get(outbound ? i.target : i.source)?.name}{" "}
                          <span className="text-muted-foreground">({i.name})</span>
                        </p>
                      );
                    })}
                </div>
                <Button asChild size="sm" variant="outline" className="mt-auto">
                  <Link href={`/applications/${selectedApp.id}`}>
                    Open application <ExternalLink />
                  </Link>
                </Button>
              </>
            )}
            {selectedIface && (
              <>
                <div className="pr-6">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Interface</p>
                  <h3 className="text-base font-semibold">{selectedIface.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StateBadge value={selectedIface.state} />
                  {mode === "delta" && <DeltaBadge status={interfaceDelta({ architectureState: selectedIface.state })} />}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                  <dt className="text-muted-foreground">From</dt>
                  <dd>{appById.get(selectedIface.source)?.name}</dd>
                  <dt className="text-muted-foreground">To</dt>
                  <dd>{appById.get(selectedIface.target)?.name}</dd>
                  <dt className="text-muted-foreground">Pattern</dt>
                  <dd>{selectedIface.pattern}</dd>
                  <dt className="text-muted-foreground">Protocol</dt>
                  <dd>{selectedIface.protocol ?? "—"}</dd>
                  <dt className="text-muted-foreground">Direction</dt>
                  <dd>{selectedIface.direction}</dd>
                  <dt className="text-muted-foreground">Data flow</dt>
                  <dd>{selectedIface.dataFlow ?? "—"}</dd>
                </dl>
                <Button asChild size="sm" variant="outline" className="mt-auto">
                  <Link href={`/applications/${selectedIface.source}`}>
                    Open source application <ExternalLink />
                  </Link>
                </Button>
              </>
            )}
          </aside>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Click an application to highlight its neighbourhood, an interface for its details, or a technology / asset to open it. The global
        architecture state switcher controls which systems and interfaces are shown.
      </p>
    </div>
  );
}

const noopSubscribe = () => () => {};

export function LandscapeMap({ data }: { data: LandscapeData }) {
  // React Flow measures the DOM and follows the resolved theme – render it on the client only.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div className="h-[calc(100dvh-14rem)] min-h-[520px] animate-pulse rounded-xl border bg-muted/40" />;
  return (
    <ReactFlowProvider>
      <MapInner data={data} />
    </ReactFlowProvider>
  );
}
