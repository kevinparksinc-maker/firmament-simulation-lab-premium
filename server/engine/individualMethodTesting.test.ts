import { describe, it, expect } from "vitest";
import { INDEPENDENT_METHOD_FIELDS, runSingleMethodEvent } from "./isolatedMethodRunner";
import { createSingleMethodAccumulator } from "./singleMethodPerformance";

const fixture = {
  id: "independent-method-protocol",
  teamA: "Los Angeles Dodgers",
  teamB: "San Francisco Giants",
  favoredTeam: "Los Angeles Dodgers",
  underdogTeam: "San Francisco Giants",
  roleAssignmentSource: "market-odds" as const,
  oddsSource: "Synthetic test-only bookmaker source, NOT real odds",
  sport: "MLB" as const,
  location: "Los Angeles, CA",
  latitude: 34.0522,
  longitude: -118.2437,
  startTime: "2024-06-15T19:10:00.000Z",
  actualWinner: "A" as const,
};

describe("31 independent method fields with no fabricated neutral outputs", () => {
  it("offers exactly 31 uniquely named slots", () => {
    expect(INDEPENDENT_METHOD_FIELDS).toHaveLength(31);
    expect(new Set(INDEPENDENT_METHOD_FIELDS.map(m => m.id)).size).toBe(31);
    expect(INDEPENDENT_METHOD_FIELDS.filter(m => m.kind === "core")).toHaveLength(21);
    expect(INDEPENDENT_METHOD_FIELDS.filter(m => m.kind === "registry")).toHaveLength(10);
  });

  it("scores one core method without calculating a 21-method fusion", () => {
    const result = runSingleMethodEvent(fixture, "CORE_01");
    expect(result.methodId).toBe("CORE_01");
    expect(result.god.chart.houses).toHaveLength(12);
    expect(result.agent.chart.houses).toHaveLength(12);
    expect(result.god.chart.bodies).toHaveLength(12);
    expect(result.god.inputs.length).toBeGreaterThan(0);
    expect(result.god.scoreA).not.toBeNull();
    expect(result.god.scoreB).not.toBeNull();
    expect(result.combined.calculation).toContain("WITHOUT including any other");
    expect(result.certification).toBe("NOT_CERTIFIED");
  });

  it("reports raw scores for same-strength values and never calls 0/0 a tie", () => {
    const voc = runSingleMethodEvent(fixture, "CORE_13");
    expect(voc.frameMethodStatus).toBe("INCOMPLETE_DOCTRINE");
    expect(voc.god.result).toBe("EVIDENCE_ONLY");
    expect(voc.combined.result).toBe("EVIDENCE_ONLY");
    expect(voc.combined.scoreA).toBeNull();
    expect(voc.combined.scoreB).toBeNull();
    expect(voc.comparison).toBe("NOT_EVALUABLE");
    // Both genuine numeric scores are retained for transparent inspection.
    expect(voc.god.scoreA).toBe(0);
    expect(voc.god.scoreB).toBe(0);
  });

  it("does not claim a natal Dasha calculation without a natal chart", () => {
    const dasha = runSingleMethodEvent(fixture, "NATAL_VIMSHOTTARI_V1");
    expect(dasha.frameMethodStatus).toBe("NOT_EVALUABLE");
    expect(dasha.god.result).toBe("MISSING_INPUT");
    expect(dasha.god.scoreA).toBeNull();
    expect(dasha.combined.scoreA).toBeNull();
    expect(dasha.comparison).toBe("NOT_EVALUABLE");
  });

  it("isolates HARMONICS_V2, showing raw research points and two frame charts", () => {
    const result = runSingleMethodEvent(fixture, "HARMONICS_V2");
    expect(result.god.chart.bodies).toHaveLength(12);
    expect(result.agent.chart.bodies).toHaveLength(12);
    expect(result.god.formula).toContain("LINEAR");
    expect(result.god.scoreA).not.toBeNull();
    expect(result.combined.result).not.toBe("MISSING_INPUT");
  });

  it("retains legacy Gaussian scores but quarantines incompatible policy", () => {
    const result = runSingleMethodEvent(fixture, "HARMONICS_V1");
    expect(result.frameMethodStatus).toBe("POLICY_CONFLICT");
    expect(result.god.scoreA).not.toBeNull();
    expect(result.combined.scoreA).toBeNull();
  });

  it("collects 10000 rows of ONE selected method without mixing methods", () => {
    const result = runSingleMethodEvent(fixture, "CORE_01");
    const accumulator = createSingleMethodAccumulator("CORE_01");
    for (let index = 0; index < 10_000; index++) accumulator.observe(result);
    const summary = accumulator.summary();
    expect(summary.games).toBe(10_000);
    expect(summary.sourceVerified).toBe(10_000);
    expect(summary.hits + summary.misses + summary.equalScoreResults + summary.noTriggers + summary.notEvaluable).toBe(10_000);
    expect(() => accumulator.observe(runSingleMethodEvent(fixture, "HARMONICS_V2"))).toThrow("cannot silently combine");
  });
});
