import type { ArchitectureState } from "./domain";
import type { Application, ApplicationTechnology, Initiative, InitiativeItem, Interface } from "./db/schema";
import type { Tone } from "./risk";

/** Global view mode: current state, target state, or the difference between both. */
export type ViewMode = "as-is" | "to-be" | "delta";

export const VIEW_MODES: { value: ViewMode; label: string; short: string }[] = [
  { value: "as-is", label: "Current State (As-Is)", short: "As-Is" },
  { value: "to-be", label: "Target State (To-Be)", short: "To-Be" },
  { value: "delta", label: "Delta / Diff View", short: "Delta" },
];

export const VIEW_MODE_COOKIE = "horizon-view-mode";

export function isViewMode(value: string | undefined): value is ViewMode {
  return value === "as-is" || value === "to-be" || value === "delta";
}

export type DeltaStatus = "new" | "removed" | "modified" | "unchanged";

export const DELTA_META: Record<DeltaStatus, { label: string; tone: Tone; description: string }> = {
  new: { label: "Introduced", tone: "green", description: "Only in the target state" },
  removed: { label: "Decommissioned", tone: "red", description: "Only in the current state" },
  modified: { label: "Modified", tone: "amber", description: "Exists in both states but is being transformed" },
  unchanged: { label: "Unchanged", tone: "gray", description: "Identical in both states" },
};

export function visibleInMode(state: ArchitectureState, mode: ViewMode): boolean {
  if (mode === "delta") return true;
  if (mode === "as-is") return state === "As-Is" || state === "Both";
  return state === "To-Be" || state === "Both";
}

const TRANSFORMING_STRATEGIES = new Set(["Rehost", "Replatform", "Refactor", "Replace"]);

/**
 * Applications present in both states are "modified" when an open initiative
 * transforms them directly, or replaces a technology they depend on.
 */
export function modifiedApplicationIds(input: {
  initiatives: Initiative[];
  initiativeItems: InitiativeItem[];
  applicationTechnologies: ApplicationTechnology[];
}): Set<string> {
  const open = new Map(
    input.initiatives
      .filter((i) => i.status !== "Completed" && TRANSFORMING_STRATEGIES.has(i.strategy))
      .map((i) => [i.id, i]),
  );
  const ids = new Set<string>();
  const techs = new Set<string>();
  for (const item of input.initiativeItems) {
    if (!open.has(item.initiativeId)) continue;
    if (item.sourceApplicationId) ids.add(item.sourceApplicationId);
    if (item.targetApplicationId) ids.add(item.targetApplicationId);
    if (item.sourceTechnologyId) techs.add(item.sourceTechnologyId);
  }
  for (const link of input.applicationTechnologies) {
    if (techs.has(link.technologyId)) ids.add(link.applicationId);
  }
  return ids;
}

export function applicationDelta(app: Pick<Application, "id" | "architectureState">, modified: Set<string>): DeltaStatus {
  if (app.architectureState === "To-Be") return "new";
  if (app.architectureState === "As-Is") return "removed";
  return modified.has(app.id) ? "modified" : "unchanged";
}

export function interfaceDelta(iface: Pick<Interface, "architectureState">): DeltaStatus {
  if (iface.architectureState === "To-Be") return "new";
  if (iface.architectureState === "As-Is") return "removed";
  return "unchanged";
}
