import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Application, Asset, Technology } from "../src/lib/db/schema";
import { assessPortfolio, eolStatus, highRiskDependencies, type PortfolioModel } from "../src/lib/risk";

const TODAY = "2026-11-25";
const ts = new Date();

const tech = (id: string, over: Partial<Technology> = {}): Technology => ({
  id,
  name: id,
  version: "1",
  category: "Language",
  vendor: null,
  releaseDate: null,
  eolDate: null,
  extendedSupportEndDate: null,
  standardizationStatus: "Approved",
  notes: null,
  createdAt: ts,
  updatedAt: ts,
  ...over,
});
const app = (id: string, over: Partial<Application> = {}): Application => ({
  id,
  name: id,
  description: null,
  businessDomain: "D",
  criticality: "Tier 2",
  owner: null,
  lifecycleStatus: "Active",
  architectureState: "Both",
  goLiveDate: null,
  plannedEolDate: null,
  hostingModel: "Cloud",
  createdAt: ts,
  updatedAt: ts,
  ...over,
});
const asset = (id: string, over: Partial<Asset> = {}): Asset => ({
  id,
  name: id,
  assetType: "Server",
  environment: "Prod",
  location: null,
  operatingSystemId: null,
  owner: null,
  eolDate: null,
  description: null,
  createdAt: ts,
  updatedAt: ts,
  ...over,
});

function model(partial: Partial<PortfolioModel>): PortfolioModel {
  return {
    applications: [],
    technologies: [],
    assets: [],
    interfaces: [],
    applicationTechnologies: [],
    applicationAssets: [],
    initiatives: [],
    initiativeItems: [],
    ...partial,
  };
}
const link = (applicationId: string, technologyId: string) => ({ id: `${applicationId}-${technologyId}`, applicationId, technologyId, usage: null, createdAt: ts, updatedAt: ts });

describe("eolStatus thresholds", () => {
  it("classifies relative to today", () => {
    assert.equal(eolStatus(null, TODAY), "unknown");
    assert.equal(eolStatus("2026-11-24", TODAY), "expired");
    assert.equal(eolStatus("2026-11-24", TODAY, "2027-06-30"), "extended");
    assert.equal(eolStatus("2026-11-24", TODAY, "2026-11-01"), "expired");
    assert.equal(eolStatus("2026-11-25", TODAY), "within6");
    assert.equal(eolStatus("2027-05-25", TODAY), "within6");
    assert.equal(eolStatus("2027-05-26", TODAY), "within12");
    assert.equal(eolStatus("2027-11-26", TODAY), "supported");
  });
});

describe("assessPortfolio", () => {
  it("flags applications on end-of-life and prohibited technologies", () => {
    const m = model({
      applications: [app("a1", { criticality: "Tier 1" }), app("a2"), app("a3", { lifecycleStatus: "Retired" })],
      technologies: [
        tech("eol", { eolDate: "2024-01-01" }),
        tech("ext", { eolDate: "2025-01-01", extendedSupportEndDate: "2028-01-01" }),
        tech("ok", { eolDate: "2030-01-01" }),
      ],
      applicationTechnologies: [link("a1", "eol"), link("a2", "ext"), link("a3", "eol")],
    });
    const risks = assessPortfolio(m, TODAY);
    assert.equal(risks.get("a1")!.level, "critical");
    assert.equal(risks.get("a1")!.score, 10 * 3); // critical weight × Tier 1 factor
    assert.equal(risks.get("a2")!.level, "high");
    assert.equal(risks.get("a3")!.level, "none", "retired applications carry no risk");
  });

  it("inherits risk from hosting assets and their operating system", () => {
    const m = model({
      applications: [app("a1")],
      technologies: [tech("os", { category: "Operating System", standardizationStatus: "Prohibited" })],
      assets: [asset("srv", { operatingSystemId: "os", eolDate: "2027-03-01" })],
      applicationAssets: [{ id: "x", applicationId: "a1", assetId: "srv", role: null, createdAt: ts, updatedAt: ts }],
    });
    const risk = assessPortfolio(m, TODAY).get("a1")!;
    assert.equal(risk.level, "critical");
    assert.ok(risk.findings.some((f) => f.kind === "asset" && f.message.includes("end of support")));
    assert.equal(highRiskDependencies(m, assessPortfolio(m, TODAY)).length, 1);
  });

  it("applies governance rules for phase-out and overdue applications", () => {
    const m = model({
      applications: [
        app("p", { lifecycleStatus: "Phase-Out", plannedEolDate: "2026-01-01" }),
        app("covered", { lifecycleStatus: "Phase-Out" }),
      ],
      initiatives: [{ id: "i", status: "In Progress" } as never],
      initiativeItems: [{ initiativeId: "i", sourceApplicationId: "covered" } as never],
    });
    const risks = assessPortfolio(m, TODAY);
    const messages = risks.get("p")!.findings.map((f) => f.message).join(" | ");
    assert.match(messages, /Planned EOL/);
    assert.match(messages, /no active migration initiative/);
    assert.equal(risks.get("covered")!.level, "none");
  });
});
