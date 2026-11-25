import { CircleAlert, CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DELTA_META, type DeltaStatus } from "@/lib/delta";
import { EOL_STATUS_META, RISK_META, type EolStatus, type RiskLevel, type Tone } from "@/lib/risk";

const CRITICALITY_TONE: Record<string, Tone> = { "Tier 1": "violet", "Tier 2": "blue", "Tier 3": "gray" };
const LIFECYCLE_TONE: Record<string, Tone> = { Planned: "blue", Active: "green", "Phase-Out": "amber", Retired: "gray" };
const STATE_TONE: Record<string, Tone> = { "As-Is": "gray", "To-Be": "violet", Both: "teal" };
const STANDARD_TONE: Record<string, Tone> = { Approved: "green", Containment: "yellow", Sunset: "orange", Prohibited: "red" };
const INITIATIVE_TONE: Record<string, Tone> = { Backlog: "gray", "In Progress": "blue", Blocked: "red", Completed: "green" };
const PHASE_TONE: Record<string, Tone> = { Planned: "gray", "In Progress": "blue", Completed: "green" };
const STRATEGY_TONE: Record<string, Tone> = {
  Rehost: "blue",
  Replatform: "teal",
  Refactor: "violet",
  Replace: "orange",
  Retire: "red",
  Retain: "gray",
};
const RISK_LEVEL_TONE: Record<string, Tone> = { Low: "green", Medium: "amber", High: "red" };

export const CriticalityBadge = ({ value }: { value: string }) => <Badge tone={CRITICALITY_TONE[value]}>{value}</Badge>;
export const LifecycleBadge = ({ value }: { value: string }) => <Badge tone={LIFECYCLE_TONE[value]}>{value}</Badge>;
export const StateBadge = ({ value }: { value: string }) => <Badge tone={STATE_TONE[value]}>{value}</Badge>;
export const StandardBadge = ({ value }: { value: string }) => <Badge tone={STANDARD_TONE[value]}>{value}</Badge>;
export const InitiativeStatusBadge = ({ value }: { value: string }) => <Badge tone={INITIATIVE_TONE[value]}>{value}</Badge>;
export const PhaseStatusBadge = ({ value }: { value: string }) => <Badge tone={PHASE_TONE[value]}>{value}</Badge>;
export const StrategyBadge = ({ value }: { value: string }) => <Badge tone={STRATEGY_TONE[value]}>{value}</Badge>;
export const RiskLevelBadge = ({ value }: { value: string }) => <Badge tone={RISK_LEVEL_TONE[value]}>{value} risk</Badge>;

export function EolBadge({ status, label }: { status: EolStatus; label?: string }) {
  const meta = EOL_STATUS_META[status];
  return <Badge tone={meta.tone}>{label ?? meta.label}</Badge>;
}

const RISK_ICON = { critical: OctagonAlert, high: TriangleAlert, medium: CircleAlert, low: Info, none: CircleCheck };

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const meta = RISK_META[level];
  const Icon = RISK_ICON[level];
  return (
    <Badge tone={meta.tone} icon={<Icon className="size-3" style={{ color: "var(--tone)" }} aria-hidden />}>
      {meta.label}
      {score !== undefined && score > 0 ? <span className="tabular text-muted-foreground"> · {score}</span> : null}
    </Badge>
  );
}

export function DeltaBadge({ status }: { status: DeltaStatus }) {
  const meta = DELTA_META[status];
  return (
    <Badge tone={meta.tone} title={meta.description}>
      {meta.label}
    </Badge>
  );
}

export function SeverityIcon({ severity, className }: { severity: RiskLevel; className?: string }) {
  const Icon = RISK_ICON[severity];
  const tone = RISK_META[severity].tone;
  const color = { red: "var(--status-critical)", orange: "var(--status-serious)", amber: "var(--status-warning)", blue: "var(--status-info)", green: "var(--status-good)" }[tone as string] ?? "var(--status-neutral)";
  return <Icon className={className ?? "size-4 shrink-0"} style={{ color }} aria-label={RISK_META[severity].label} />;
}
