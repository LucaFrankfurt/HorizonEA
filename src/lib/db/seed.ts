import { sql } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { seedApplications, seedAssets, seedInitiatives, seedInterfaces, seedTechnologies } from "./seed-data";

const ALL_TABLES = [
  "initiative_phases",
  "initiative_items",
  "initiatives",
  "application_assets",
  "application_technologies",
  "interfaces",
  "assets",
  "technologies",
  "applications",
];

/** Removes all data (schema stays intact). */
export async function clearDatabase(db: Database) {
  await db.execute(sql.raw(`TRUNCATE TABLE ${ALL_TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`));
}

export async function seedDatabase(db: Database, options: { reset?: boolean } = {}) {
  if (options.reset) await clearDatabase(db);

  return db.transaction(async (tx) => {
    const techRows = await tx
      .insert(s.technologies)
      .values(
        seedTechnologies.map((t) => ({
          name: t.name,
          version: t.version,
          category: t.category,
          vendor: t.vendor,
          releaseDate: t.releaseDate ?? null,
          eolDate: t.eolDate ?? null,
          extendedSupportEndDate: t.extendedSupportEndDate ?? null,
          standardizationStatus: t.standardizationStatus,
          notes: t.notes ?? null,
        })),
      )
      .returning({ id: s.technologies.id });
    const techId = new Map(seedTechnologies.map((t, i) => [t.key, techRows[i].id]));
    const tech = (key: string) => {
      const id = techId.get(key);
      if (!id) throw new Error(`Seed: unknown technology key ${key}`);
      return id;
    };

    const assetRows = await tx
      .insert(s.assets)
      .values(
        seedAssets.map((a) => ({
          name: a.name,
          assetType: a.assetType,
          environment: a.environment,
          location: a.location,
          operatingSystemId: a.os ? tech(a.os) : null,
          owner: a.owner,
          eolDate: a.eolDate ?? null,
          description: a.description ?? null,
        })),
      )
      .returning({ id: s.assets.id, name: s.assets.name });
    const assetId = new Map(assetRows.map((a) => [a.name, a.id]));

    const appRows = await tx
      .insert(s.applications)
      .values(
        seedApplications.map((a) => ({
          name: a.name,
          description: a.description,
          businessDomain: a.businessDomain,
          criticality: a.criticality,
          owner: a.owner,
          lifecycleStatus: a.lifecycleStatus,
          architectureState: a.architectureState,
          goLiveDate: a.goLiveDate ?? null,
          plannedEolDate: a.plannedEolDate ?? null,
          hostingModel: a.hostingModel,
        })),
      )
      .returning({ id: s.applications.id, name: s.applications.name });
    const appIdByName = new Map(appRows.map((a) => [a.name, a.id]));
    const app = (name: string) => {
      const id = appIdByName.get(name);
      if (!id) throw new Error(`Seed: unknown application ${name}`);
      return id;
    };

    const appTech = seedApplications.flatMap((a) =>
      (a.tech ?? []).map(([key, usage]) => ({ applicationId: app(a.name), technologyId: tech(key), usage })),
    );
    if (appTech.length) await tx.insert(s.applicationTechnologies).values(appTech);

    const appAssets = seedApplications.flatMap((a) =>
      (a.assets ?? []).map(([name, role]) => {
        const id = assetId.get(name);
        if (!id) throw new Error(`Seed: unknown asset ${name}`);
        return { applicationId: app(a.name), assetId: id, role };
      }),
    );
    if (appAssets.length) await tx.insert(s.applicationAssets).values(appAssets);

    await tx.insert(s.interfaces).values(
      seedInterfaces.map((i) => ({
        name: i.name,
        sourceApplicationId: app(i.source),
        targetApplicationId: app(i.target),
        dataFlow: i.dataFlow,
        protocol: i.protocol,
        integrationPattern: i.integrationPattern,
        direction: i.direction ?? "Unidirectional",
        architectureState: i.architectureState,
      })),
    );

    for (const init of seedInitiatives) {
      const [row] = await tx
        .insert(s.initiatives)
        .values({
          name: init.name,
          description: init.description,
          strategy: init.strategy,
          status: init.status,
          owner: init.owner,
          startDate: init.startDate,
          targetDate: init.targetDate,
          budget: init.budget,
          effortPersonDays: init.effortPersonDays,
          riskLevel: init.riskLevel,
          riskNotes: init.riskNotes ?? null,
        })
        .returning({ id: s.initiatives.id });

      const items = [
        ...(init.apps ?? []).map(([src, tgt, notes]) => ({
          initiativeId: row.id,
          kind: "Application" as const,
          sourceApplicationId: src ? app(src) : null,
          targetApplicationId: tgt ? app(tgt) : null,
          notes: notes ?? null,
        })),
        ...(init.techs ?? []).map(([src, tgt, notes]) => ({
          initiativeId: row.id,
          kind: "Technology" as const,
          sourceTechnologyId: src ? tech(src) : null,
          targetTechnologyId: tgt ? tech(tgt) : null,
          notes: notes ?? null,
        })),
      ];
      if (items.length) await tx.insert(s.initiativeItems).values(items);

      await tx.insert(s.initiativePhases).values(
        init.phases.map(([name, startDate, endDate, status], index) => ({
          initiativeId: row.id,
          name,
          startDate,
          endDate,
          status,
          sortOrder: index,
        })),
      );
    }

    return {
      applications: appRows.length,
      technologies: techRows.length,
      assets: assetRows.length,
      interfaces: seedInterfaces.length,
      initiatives: seedInitiatives.length,
    };
  });
}
