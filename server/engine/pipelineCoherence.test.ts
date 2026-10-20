import { describe, expect, it } from "vitest";
import { resolveEventContract } from "./eventPipelineContract";
import { runSingleMethodEvent, INDEPENDENT_METHOD_FIELDS } from "./isolatedMethodRunner";
import { runSimulationEvent } from "./simulationAdapter";

const fixture = {
  id: "cross-pipeline-fixture",
  teamA: "Dodgers", teamB: "Giants",
  sport: "MLB" as const,
  location: "Los Angeles, CA",
  latitude: 34.0522,
  longitude: -118.2437,
  startTime: "2024-06-15T19:10:00.000Z",
};

describe("complete event → chart → 31 methods → results pipeline", () => {
  it("maps bookmaker favorite to ASC A even when the favorite is the away side", () => {
    const normalized = resolveEventContract({
      ...fixture, favoredTeam: "Giants", underdogTeam: "Dodgers",
      roleAssignmentSource: "market-odds", oddsSource: "Synthetic source for contract test",
    });
    expect(normalized.gameInput.teamA).toBe("Giants");
    expect(normalized.gameInput.teamB).toBe("Dodgers");
    expect(normalized.roleAssignmentSource).toBe("market-odds");
    const core = runSimulationEvent({
      ...fixture, favoredTeam: "Giants", underdogTeam: "Dodgers",
      roleAssignmentSource: "market-odds", oddsSource: "Synthetic source for contract test",
    });
    const solo = runSingleMethodEvent({
      ...fixture, favoredTeam: "Giants", underdogTeam: "Dodgers",
      roleAssignmentSource: "market-odds", oddsSource: "Synthetic source for contract test",
    }, "CORE_01");
    expect(core.input.teamA).toBe(solo.event.teamA);
    expect(core.input.teamB).toBe(solo.event.teamB);
  });

  it("does not count unsourced legacy market labels as verified favorite tests", () => {
    const input = {
      ...fixture, favoredTeam: "Dodgers", underdogTeam: "Giants",
      roleAssignmentSource: "market-odds" as const,
      actualWinner: "A" as const,
    };
    const full = runSimulationEvent(input);
    const solo = runSingleMethodEvent(input, "CORE_01");
    expect(full.evaluationFramework.roleAssignmentSource).toBe("manual");
    expect(full.evaluationFramework.primaryResearchEligible).toBe(false);
    expect(full.evaluationFramework.provenanceWarning).toContain("downgraded");
    expect(solo.event.roleAssignmentSource).toBe("manual");
    expect(solo.methodologyNotes.join(" ")).toContain("downgraded");
  });

  it("reproduces every standalone core and registry raw score from its full simulation counterpart", () => {
    const full = runSimulationEvent(fixture);
    expect(INDEPENDENT_METHOD_FIELDS).toHaveLength(31);
    for (const field of INDEPENDENT_METHOD_FIELDS) {
      const isolated = runSingleMethodEvent(fixture, field.id);
      if (field.kind === "core") {
        const index = field.index;
        expect(isolated.god.scoreA, field.id).toBeCloseTo(full.godView.allLayers[index]!.scoreA, 5);
        expect(isolated.god.scoreB, field.id).toBeCloseTo(full.godView.allLayers[index]!.scoreB, 5);
        expect(isolated.agent.scoreA, field.id).toBeCloseTo(full.agentView.allLayers[index]!.scoreA, 5);
        expect(isolated.agent.scoreB, field.id).toBeCloseTo(full.agentView.allLayers[index]!.scoreB, 5);
      } else {
        const g = full.methodResults.godView.find(x => x.methodId === field.id)!;
        const a = full.methodResults.agentView.find(x => x.methodId === field.id)!;
        expect(isolated.god.scoreA).toBe(g.scoreA);
        expect(isolated.god.scoreB).toBe(g.scoreB);
        expect(isolated.agent.scoreA).toBe(a.scoreA);
        expect(isolated.agent.scoreB).toBe(a.scoreB);
      }
      expect(isolated.god.chart.houses).toHaveLength(12);
      expect(isolated.agent.chart.houses).toHaveLength(12);
      expect(isolated.god.chart.bodies).toHaveLength(12);
      expect(isolated.agent.chart.bodies).toHaveLength(12);
      expect(isolated.certification).toBe("NOT_CERTIFIED");
    }
  });

  it("uses one dawn-anchored Agent chart for isolated core and registered methods", () => {
    const dawn = {
      ...fixture,
      agentViewModel: "fixed-earth-dawn-anchored" as const,
      sunriseTime: "2024-06-15T12:45:00.000Z",
      sunriseSource: "Synthetic dawn fixture",
    };
    const core = runSingleMethodEvent(dawn, "CORE_01");
    const vedic = runSingleMethodEvent(dawn, "ASHTAKAVARGA_V1");
    const coreHouses = Object.fromEntries(core.agent.chart.bodies.map(x=>[x.planet,x.house]));
    const vedicHouses = Object.fromEntries(vedic.agent.chart.bodies.map(x=>[x.planet,x.house]));
    expect(vedicHouses).toEqual(coreHouses);
    const full = runSimulationEvent(dawn);
    expect(core.agent.scoreA).toBeCloseTo(full.agentView.allLayers[0]!.scoreA, 5);
    expect(vedic.agent.scoreA).toBe(full.methodResults.agentView.find(x=>x.methodId === "ASHTAKAVARGA_V1")!.scoreA);
  });
});
