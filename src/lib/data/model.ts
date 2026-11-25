import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "../db/client";
import * as s from "../db/schema";
import { todayISO } from "../dates";
import { applicationDelta, modifiedApplicationIds, type DeltaStatus } from "../delta";
import { assessPortfolio, type ApplicationRisk, type PortfolioModel } from "../risk";

export interface LoadedModel extends PortfolioModel {
  initiativePhases: s.InitiativePhase[];
  today: string;
  risks: Map<string, ApplicationRisk>;
  deltas: Map<string, DeltaStatus>;
}

/**
 * Loads the full portfolio in a handful of queries. EA repositories are small
 * (hundreds to low thousands of rows), so analysis runs in memory on top.
 */
export async function loadModel(): Promise<LoadedModel> {
  const db = await getDb();
  const [
    applications,
    technologies,
    assets,
    interfaces,
    applicationTechnologies,
    applicationAssets,
    initiatives,
    initiativeItems,
    initiativePhases,
  ] = await Promise.all([
    db.select().from(s.applications).orderBy(asc(s.applications.name)),
    db.select().from(s.technologies).orderBy(asc(s.technologies.name), asc(s.technologies.version)),
    db.select().from(s.assets).orderBy(asc(s.assets.name)),
    db.select().from(s.interfaces).orderBy(asc(s.interfaces.name)),
    db.select().from(s.applicationTechnologies),
    db.select().from(s.applicationAssets),
    db.select().from(s.initiatives).orderBy(asc(s.initiatives.targetDate)),
    db.select().from(s.initiativeItems).orderBy(asc(s.initiativeItems.createdAt)),
    db.select().from(s.initiativePhases).orderBy(asc(s.initiativePhases.sortOrder)),
  ]);

  const model: PortfolioModel = {
    applications,
    technologies,
    assets,
    interfaces,
    applicationTechnologies,
    applicationAssets,
    initiatives,
    initiativeItems,
  };
  const today = todayISO();
  const risks = assessPortfolio(model, today);
  const modified = modifiedApplicationIds(model);
  const deltas = new Map(applications.map((a) => [a.id, applicationDelta(a, modified)]));
  return { ...model, initiativePhases, today, risks, deltas };
}

/** Serializable subset passed to client components. */
export function riskRecord(model: LoadedModel) {
  return Object.fromEntries(model.risks);
}
