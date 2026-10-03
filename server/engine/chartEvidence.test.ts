import { describe, expect, it } from "vitest";
import { buildChartEvidence, getHouseAnalysis, getMansionAnalysis, getStrongestPatterns } from "./chartEvidence";
import { generateFixedJ2000KPPrediction } from "./firmamentEngine";

const input = {
  teamA: "Los Angeles Dodgers",
  teamB: "San Francisco Giants",
  gameType: "MLB" as const,
  location: "Los Angeles, CA",
  coordinates: { latitude: 34.0522, longitude: -118.2437 },
  startTime: new Date("2024-06-15T19:10:00.000Z"),
};

describe("Chart Evidence API", () => {
  it("builds a Mansion × House graph from deterministic layer outputs", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const graph = buildChartEvidence(prediction, input.startTime);
    expect(graph.houses).toHaveLength(12);
    expect(graph.cells.length).toBeGreaterThan(0);
    expect(graph.cells.every((cell) => cell.sav >= 0 && cell.house >= 1 && cell.house <= 12)).toBe(true);
    expect(graph.strongestPatterns.length).toBeGreaterThan(0);
  });

  it("supports house, mansion, and strongest-pattern queries without recalculation", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const graph = buildChartEvidence(prediction, input.startTime);
    const house = getHouseAnalysis(graph, 10);
    expect(house.house?.house).toBe(10);
    const mansion = graph.mansions[0]?.mansion;
    expect(mansion).toBeTruthy();
    expect(getMansionAnalysis(graph, mansion!).mansion?.mansion).toBe(mansion);
    expect(getStrongestPatterns(graph)).toEqual(graph.strongestPatterns);
  });
});
