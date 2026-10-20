import { describe, expect, it } from "vitest";
import { runSimulationEvent } from "./simulationAdapter";
import { createMethodPerformanceAccumulator } from "./methodPerformance";

const fixture = {
  id: "independent-source-required",
  teamA: "Los Angeles Dodgers",
  teamB: "San Francisco Giants",
  favoredTeam: "Los Angeles Dodgers",
  underdogTeam: "San Francisco Giants",
  roleAssignmentSource: "market-odds" as const,
  oddsSource: "Archived bookmaker market feed (test fixture only)",
  sport: "MLB" as const,
  location: "Los Angeles, CA",
  latitude: 34.0522,
  longitude: -118.2437,
  startTime: "2024-06-15T19:10:00.000Z",
  actualWinner: "A" as const,
};

describe("31-line research challenger (not a doctrinal certification)", () => {
  it("exposes and runs every core and registered method without rewriting the 21-method baseline", () => {
    const result = runSimulationEvent(fixture);
    expect(result.godView.allLayers).toHaveLength(21);
    expect(result.agentView.allLayers).toHaveLength(21);
    expect(result.synthesisView.methods).toHaveLength(21);
    expect(result.expandedExperiment.methodCount).toBe(31);
    expect(result.expandedExperiment.methods).toHaveLength(31);
    expect(result.methodResults.godView).toHaveLength(10);
    expect(result.methodResults.agentView).toHaveLength(10);
    expect(result.expandedExperiment.valid).toBe(true);
    expect(result.expandedExperiment.requirements.supportedHouses).toBe(12);
    expect(result.expandedExperiment.requirements.supportedBodies).toBe(12);
    expect(result.expandedExperiment.requirements.scoringTraceCertified).toBe(false);
    expect(result.expandedExperiment.methods.every(m => m.certification === "NOT_CERTIFIED")).toBe(true);
    expect(result.expandedExperiment.baseline21Winner).toBe(result.synthesisView.winner);
  });

  it("excludes obsolete Gaussian orb policy and missing natal data transparently", () => {
    const experiment = runSimulationEvent(fixture).expandedExperiment;
    expect(experiment.countedMethods).toBeGreaterThan(0);
    expect(experiment.excludedMethods).toBeGreaterThanOrEqual(2);
    expect(experiment.countedMethods + experiment.excludedMethods).toBe(31);
    const gauss = experiment.methods.find(m => m.id === "HARMONICS_V1")!;
    expect(gauss.executedGod && gauss.executedAgent).toBe(true);
    expect(gauss.status).toBe("POLICY_CONFLICT");
    expect(gauss.counted).toBe(false);
    const natal = experiment.methods.find(m => m.id === "NATAL_VIMSHOTTARI_V1")!;
    expect(natal.status).toBe("MISSING_INPUT");
    expect(natal.counted).toBe(false);
    expect(natal.scoreGodA).toBeNull();
    expect(natal.scoreAgentA).toBeNull();
    const linear = experiment.methods.find(m => m.id === "HARMONICS_V2")!;
    expect(linear.counted).toBe(true);
    expect(experiment.voteA + experiment.voteB).toBeLessThanOrEqual(experiment.countedMethods);
    expect(experiment.voteA + experiment.voteB).toBeGreaterThan(0);
  });

  it("records 10,000 eligible fixture observations without storing 10,000 result objects", () => {
    const calculated = runSimulationEvent(fixture);
    const collector = createMethodPerformanceAccumulator();
    for (let i = 0; i < 10_000; i++) collector.observe(calculated);
    const report = collector.summary();
    expect(report.processed).toBe(10_000);
    expect(report.researchEligible).toBe(10_000);
    expect(report.methods).toHaveLength(31);
    expect(report.methods.find(m => m.id === "HARMONICS_V1")?.excluded).toBe(10_000);
    expect(report.methods.find(m => m.id === "NATAL_VIMSHOTTARI_V1")?.abstentions).toBe(10_000);
    expect(report.baseline.favoriteOnly.sample).toBe(10_000);
  });

  it("does not grade mislabeled or missing-odds-source fixtures as historical market tests", () => {
    const result = runSimulationEvent({ ...fixture, oddsSource: undefined, roleAssignmentSource: "manual" });
    const accumulator = createMethodPerformanceAccumulator();
    accumulator.observe(result);
    const report = accumulator.summary();
    expect(report.withActualWinner).toBe(1);
    expect(report.researchEligible).toBe(0);
    expect(report.baseline.favoriteOnly.sample).toBe(0);
  });
});
