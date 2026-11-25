import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addMonths, daysBetween, formatDate, normalizeDate, relativeFromToday } from "../src/lib/dates";
import { applicationDelta, interfaceDelta, modifiedApplicationIds, visibleInMode } from "../src/lib/delta";
import { applicationSchema, crossRules, interfaceSchema, parsePartial } from "../src/lib/validation";

describe("dates", () => {
  it("adds months and clamps to the end of the month", () => {
    assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
    assert.equal(addMonths("2026-11-25", 6), "2027-05-25");
    assert.equal(addMonths("2026-03-15", -3), "2025-12-15");
  });
  it("computes day differences and formats dates deterministically", () => {
    assert.equal(daysBetween("2026-11-25", "2026-12-25"), 30);
    assert.equal(daysBetween("2026-11-25", "2026-11-20"), -5);
    assert.equal(formatDate("2027-01-05"), "05 Jan 2027");
    assert.equal(formatDate(null), "—");
    assert.equal(relativeFromToday("2026-12-05", "2026-11-25"), "in 10 days");
  });
  it("normalises loose date input from CSV files", () => {
    assert.equal(normalizeDate("2027-1-5"), "2027-01-05");
    assert.equal(normalizeDate("2027-01-05T00:00:00Z"), "2027-01-05");
    assert.equal(normalizeDate("05.01.2027"), "2027-01-05");
    assert.equal(normalizeDate("  "), null);
  });
});

describe("validation", () => {
  it("accepts enum variations and applies defaults on create", () => {
    const parsed = applicationSchema.parse({ name: " CRM ", businessDomain: "Sales", criticality: "tier1", hostingModel: "on premises", architectureState: "AS-IS" });
    assert.equal(parsed.name, "CRM");
    assert.equal(parsed.criticality, "Tier 1");
    assert.equal(parsed.hostingModel, "On-Premises");
    assert.equal(parsed.architectureState, "As-Is");
    assert.equal(parsed.lifecycleStatus, "Active");
    assert.equal(parsed.description, null);
  });
  it("treats blank enum cells as not supplied", () => {
    const parsed = applicationSchema.parse({ name: "X", businessDomain: "Y", criticality: "" });
    assert.equal(parsed.criticality, "Tier 2");
  });
  it("rejects invalid values with readable messages", () => {
    const result = applicationSchema.safeParse({ name: "", businessDomain: "Y", criticality: "Tier 9", goLiveDate: "soon" });
    assert.equal(result.success, false);
    const paths = result.error!.issues.map((i) => i.path.join("."));
    assert.deepEqual(paths.sort(), ["criticality", "goLiveDate", "name"]);
  });
  it("partial updates never overwrite fields that were not supplied", () => {
    const result = parsePartial(applicationSchema, { owner: "Team A" });
    assert.equal(result.success, true);
    assert.deepEqual(result.data, { owner: "Team A" });
    const cleared = parsePartial(applicationSchema, { description: "" });
    assert.deepEqual(cleared.data, { description: null });
  });
  it("enforces cross-field rules", () => {
    assert.deepEqual(crossRules.application({ goLiveDate: "2027-01-01", plannedEolDate: "2026-01-01" }), {
      plannedEolDate: "Planned EOL must be after the go-live date",
    });
    const id = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";
    const iface = interfaceSchema.parse({ name: "loop", sourceApplicationId: id, targetApplicationId: id });
    assert.ok(crossRules.interface(iface).targetApplicationId);
    assert.ok(crossRules.initiativeItem({ kind: "Application" }).sourceApplicationId);
    assert.ok(crossRules.initiativeItem({ kind: "Technology", sourceApplicationId: id, sourceTechnologyId: id }).kind);
  });
});

describe("as-is / to-be delta", () => {
  it("filters by view mode", () => {
    assert.equal(visibleInMode("As-Is", "as-is"), true);
    assert.equal(visibleInMode("To-Be", "as-is"), false);
    assert.equal(visibleInMode("Both", "to-be"), true);
    assert.equal(visibleInMode("As-Is", "delta"), true);
  });
  it("classifies applications and interfaces", () => {
    const initiatives = [
      { id: "i1", status: "In Progress", strategy: "Replatform" },
      { id: "i2", status: "Completed", strategy: "Rehost" },
      { id: "i3", status: "Backlog", strategy: "Retain" },
    ] as never;
    const initiativeItems = [
      { initiativeId: "i1", sourceApplicationId: "a1", targetApplicationId: "a1", sourceTechnologyId: null },
      { initiativeId: "i1", sourceApplicationId: null, targetApplicationId: null, sourceTechnologyId: "t1" },
      { initiativeId: "i2", sourceApplicationId: "a2", targetApplicationId: "a2", sourceTechnologyId: null },
      { initiativeId: "i3", sourceApplicationId: "a4", targetApplicationId: null, sourceTechnologyId: null },
    ] as never;
    const applicationTechnologies = [{ applicationId: "a3", technologyId: "t1" }] as never;
    const modified = modifiedApplicationIds({ initiatives, initiativeItems, applicationTechnologies });
    assert.deepEqual([...modified].sort(), ["a1", "a3"]);
    assert.equal(applicationDelta({ id: "a1", architectureState: "Both" }, modified), "modified");
    assert.equal(applicationDelta({ id: "a2", architectureState: "Both" }, modified), "unchanged");
    assert.equal(applicationDelta({ id: "x", architectureState: "To-Be" }, modified), "new");
    assert.equal(applicationDelta({ id: "x", architectureState: "As-Is" }, modified), "removed");
    assert.equal(interfaceDelta({ architectureState: "To-Be" }), "new");
  });
});
