import { describe, expect, it } from "vitest";
import { buildSharedMasterChart, generateCartesianKPPrediction, generatePredictionForModel, type GameInput } from "./firmamentEngine";
import { runSimulationEvent } from "./simulationAdapter";

describe("shared master chart contract", () => {
  const input: GameInput = {
    teamA: "Blue Jays",
    teamB: "Red Sox",
    location: "Toronto",
    coordinates: { latitude: 43.65, longitude: -79.38 },
    gameType: "MLB",
    startTime: new Date("2026-08-10T23:07:00.000Z"),
  };

  it("reuses the same immutable frame predictions for every downstream method path", () => {
    const master = buildSharedMasterChart(input);
    const sharedInput = { ...input, masterChart: master };

    expect(master.god).toBe(generateCartesianKPPrediction(sharedInput));
    expect(master.agent).toBe(generatePredictionForModel(sharedInput, "sunrise-cartesian"));
    expect(master.god.cartesianChart).toBe(master.agent.cartesianChart);
    expect(master.masterChartId).toMatch(/^master-[0-9a-f]{8}$/);

    const result = runSimulationEvent({
      teamA: input.teamA,
      teamB: input.teamB,
      sport: input.gameType,
      location: input.location,
      latitude: input.coordinates!.latitude,
      longitude: input.coordinates!.longitude,
      startTime: input.startTime.toISOString(),
    });
    const ids = [
      ...result.methodResults.godView,
      ...result.methodResults.agentView,
    ].map((method) => method.masterChartId);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(1);
    expect(result.methodResults.masterChartId).toBe(ids[0]);
    expect(result.methodResults.godView.every((method) => method.sourceSnapshot === "shared-master-chart")).toBe(true);
    expect(result.methodResults.agentView.every((method) => method.sourceSnapshot === "shared-master-chart")).toBe(true);
  });
});
