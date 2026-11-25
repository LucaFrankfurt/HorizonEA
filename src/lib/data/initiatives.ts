import { techLabel } from "../risk";
import type { LoadedModel } from "./model";

/** Human readable source / target names per initiative. */
export function initiativeMappings(model: LoadedModel) {
  const appName = new Map(model.applications.map((a) => [a.id, a.name]));
  const techName = new Map(model.technologies.map((t) => [t.id, techLabel(t)]));
  const result = new Map<string, { sources: string[]; targets: string[]; phasesDone: number; phasesTotal: number }>();
  for (const i of model.initiatives) result.set(i.id, { sources: [], targets: [], phasesDone: 0, phasesTotal: 0 });
  for (const item of model.initiativeItems) {
    const entry = result.get(item.initiativeId);
    if (!entry) continue;
    const src = item.sourceApplicationId ? appName.get(item.sourceApplicationId) : item.sourceTechnologyId ? techName.get(item.sourceTechnologyId) : null;
    const tgt = item.targetApplicationId ? appName.get(item.targetApplicationId) : item.targetTechnologyId ? techName.get(item.targetTechnologyId) : null;
    if (src && !entry.sources.includes(src)) entry.sources.push(src);
    if (tgt && !entry.targets.includes(tgt)) entry.targets.push(tgt);
  }
  for (const p of model.initiativePhases) {
    const entry = result.get(p.initiativeId);
    if (!entry) continue;
    entry.phasesTotal++;
    if (p.status === "Completed") entry.phasesDone++;
  }
  return result;
}
