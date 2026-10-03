import { describe, expect, it } from "vitest";
import { runSimulationBatch, runSimulationEvent } from "./simulationAdapter";

const fixture = {
  id: "fixture-dodgers-giants",
  teamA: "Los Angeles Dodgers",
  teamB: "San Francisco Giants",
  sport: "MLB" as const,
  location: "Los Angeles, CA",
  latitude: 34.0522,
  longitude: -118.2437,
  startTime: "2024-06-15T19:10:00.000Z",
  actualWinner: "A" as const,
};

describe("simulation adapter", () => {
  it("returns the full chart and both frame outputs from the Firmament engine", () => {
    const result = runSimulationEvent(fixture);

    expect(result.engine.source).toBe("firmament-engine");
    expect(result.engine.hamalAnchor).toContain("13° Aries");
    expect(result.chart.godView.planets).toHaveLength(9);
    expect(result.chart.godView.houses).toHaveLength(12);
    expect(result.chart.agentView.planets).toHaveLength(9);
    expect(result.godView.name).toBe("God View");
    expect(result.agentView.name).toBe("Agent’s View");
    expect(result.godView.allLayers.length).toBeGreaterThan(0);
    expect(result.agentView.allLayers.length).toBeGreaterThan(0);
    expect(result.experimentalLayers.status).toBe("experimental-read-only");
    expect(result.experimentalLayers.godView.harmonics.verdict.layer).toBe("harmonics");
    expect(result.experimentalLayers.godView.varga.verdict.layer).toBe("varga");
    expect(result.experimentalLayers.godView.ashtakavarga.verdict.layer).toBe("ashtakavarga");
    expect(result.experimentalLayers.godView.dasha.verdict.layer).toBe("dasha");
    expect(result.methodResults.registryVersion).toBe("METHOD_REGISTRY_V1");
    expect(result.methodResults.godView.some((method) => method.methodId === "HARMONICS_V2")).toBe(true);
    expect(result.methodResults.godView.every((method) => method.calculationVersion.length > 0)).toBe(true);
    expect(result.evaluationFramework.sideA).toContain("favored");
    expect(result.evaluationFramework.sideB).toContain("underdog");
    expect(result.evaluationFramework.homeAwayIsMetadataOnly).toBe(true);
    expect(result.evaluationFramework.primaryResearchEligible).toBe(false);
    expect(result.godView.allLayers).toHaveLength(21);
  });

  it("uses explicit favored and underdog teams instead of home-away order", () => {
    const result = runSimulationEvent({ ...fixture, teamA: "Home Team", teamB: "Away Team", favoredTeam: "Away Team", underdogTeam: "Home Team", homeTeam: "Home Team", awayTeam: "Away Team", roleAssignmentSource: "market-odds" });
    expect(result.input.teamA).toBe("Away Team");
    expect(result.input.teamB).toBe("Home Team");
    expect(result.evaluationFramework.primaryResearchEligible).toBe(true);
    expect(result.evaluationFramework.roleAssignmentSource).toBe("market-odds");
  });

  it("labels each layer against the verified historical winner", () => {
    const result = runSimulationEvent(fixture);
    const verdicts = new Set(result.godView.allLayers.map((layer) => layer.verdict));

    expect(verdicts).toContain("hit");
    expect(verdicts).toContain("miss");
    expect(["hit", "miss"]).toContain(result.baseline.verdict);
    expect(result.comparison.verified).toBe(true);
  });

  it("keeps unverified events separate from accuracy calculations", () => {
    const result = runSimulationBatch([fixture, { ...fixture, id: "unverified", actualWinner: undefined }]);

    expect(result.summary.total).toBe(2);
    expect(result.summary.verified).toBe(1);
    expect(result.summary.unverified).toBe(1);
    expect(result.summary.baselineAccuracy).toBe(result.results[0]?.baseline.verdict === "hit" ? 100 : 0);
    expect(result.results[1]?.baseline.verdict).toBe("unverified");
  });

  it("keeps all forty method overlays addressable for the observatory evidence surface", () => {
    const result = runSimulationEvent(fixture);
    const overlays = [
      ...result.godView.allLayers.map((layer) => ({ frame: "God View", ...layer })),
      ...result.agentView.allLayers.map((layer) => ({ frame: "Agent View", ...layer })),
    ];

    expect(result.godView.allLayers).toHaveLength(21);
    expect(result.agentView.allLayers).toHaveLength(21);
    expect(overlays).toHaveLength(42);
    expect(overlays.every((layer) => ["God View", "Agent View"].includes(layer.frame))).toBe(true);
    expect(overlays.every((layer) => ["A", "B", "TIE"].includes(layer.winner))).toBe(true);
    expect(overlays.every((layer) => Number.isFinite(layer.scoreA) && Number.isFinite(layer.scoreB))).toBe(true);
    expect(overlays.every((layer) => layer.detail.length > 0)).toBe(true);
  });

  it("exposes formula inputs and final arithmetic for every method in both frames", () => {
    const result = runSimulationEvent(fixture);
    const overlays = [...result.godView.allLayers, ...result.agentView.allLayers];

    expect(overlays.every((layer) => layer.calculation?.formula.length)).toBe(true);
    expect(overlays.every((layer) => (layer.calculation?.inputs.length ?? 0) > 0)).toBe(true);
    expect(overlays.every((layer) => layer.calculation?.steps.some((step) => step.includes("Final method output")))).toBe(true);
  });

  it("preserves a live-game event as a prospective, unverified research input", () => {
    const result = runSimulationEvent({
      ...fixture,
      id: "live-game-input",
      actualWinner: undefined,
    });

    expect(result.input.id).toBe("live-game-input");
    expect(result.comparison.verified).toBe(false);
    expect(result.baseline.verdict).toBe("unverified");
    expect(result.godView.summary.unverified).toBeGreaterThan(0);
    expect(result.agentView.summary.unverified).toBeGreaterThan(0);
  });
});
