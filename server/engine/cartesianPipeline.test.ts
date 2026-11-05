import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { buildEventCartesianChart } from "./cartesianEphemeris";
import { runSimulationEvent } from "./simulationAdapter";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof import("astronomy-engine");
const fixture = {
  teamA: "Favorite", teamB: "Underdog", sport: "NFL" as const,
  location: "Dallas", latitude: 32.7767, longitude: -96.797,
  startTime: "2026-11-01T18:00:00.000Z",
};
const normalize = (x: number) => ((x % 360) + 360) % 360;

describe("Cartesian XYZ → sunrise → methods → synthesis", () => {
  it("uses the sunrise Sun vector, keeps event vectors unshifted, and shares exact house cusps throughout", () => {
    const result = runSimulationEvent(fixture);
    const receipt = result.engine.cartesianChart;
    const sun = Astronomy.GeoVector(Astronomy.Body.Sun, new Date(receipt.sunrise.sunriseUtc), false);
    const anchor = normalize(Math.atan2(sun.y, sun.x) * 180 / Math.PI);
    const hours = (Date.parse(fixture.startTime) - Date.parse(receipt.sunrise.sunriseUtc)) / 3600000;
    const expectedAsc = normalize(anchor + hours * 15);
    expect(result.agentView.ascendantLongitude).toBeCloseTo(expectedAsc, 10);
    expect(result.chart.agentView.ascendantLongitude).toBeCloseTo(expectedAsc, 10);
    expect(receipt.sunrise.elapsedRotationDegrees).toBe(hours * 15);
    expect(result.agentView.sunriseSource).toContain("SearchRiseSet");

    for (const name of ["Sun", "Moon", "Mars", "Jupiter", "Saturn", "Pluto"] as const) {
      const xyz = Astronomy.GeoVector(Astronomy.Body[name], new Date(fixture.startTime), false);
      const angle = normalize(Math.atan2(xyz.y, xyz.x) * 180 / Math.PI);
      const agent = result.chart.agentView.planets.find(p => p.planet === name)!;
      const god = result.chart.godView.planets.find(p => p.planet === name)!;
      expect(agent.backgroundWheelLongitude).toBeCloseTo(angle, 4);
      expect(god.backgroundWheelLongitude).toBe(agent.backgroundWheelLongitude);
      expect(agent.house).toBe(Math.floor(normalize(angle - expectedAsc) / 30) + 1);
      expect(result.agentView.fullChartLedger.bodies.find(p => p.planet === name)?.house).toBe(agent.house);
      expect(result.methodResults.agentView.every(method => method.calculationVersion.length > 0)).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      expect(result.chart.agentView.houses[i]!.cuspLongitude).toBeCloseTo(normalize(expectedAsc + i * 30), 4);
    }
    expect(result.frameParity.valid).toBe(true);
    expect(result.synthesisView.methods).toHaveLength(21);
    for (const frame of [result.godView, result.agentView]) {
      expect(frame.allLayers).toHaveLength(21);
      expect(frame.allLayers.reduce((sum, row) => sum + row.scoreA, 0)).toBeCloseTo(frame.synthesis.scoreA, 2);
      expect(frame.allLayers.reduce((sum, row) => sum + row.scoreB, 0)).toBeCloseTo(frame.synthesis.scoreB, 2);
    }
  });

  it("advances exactly 15 degrees with a shared sunrise, with no sidereal rate", () => {
    const first = runSimulationEvent(fixture);
    const second = runSimulationEvent({ ...fixture, startTime: "2026-11-01T19:00:00.000Z", sunriseTime: first.agentView.sunriseTime, sunriseSource: first.agentView.sunriseSource });
    expect(normalize(second.agentView.ascendantLongitude - first.agentView.ascendantLongitude)).toBeCloseTo(15, 10);
  });

  it("uses the preceding sunrise before local dawn and rejects missing physical inputs", () => {
    const chart = buildEventCartesianChart({ startTime: new Date("2026-11-01T09:00:00Z"), latitude: 32.7767, longitude: -96.797 });
    expect(Date.parse(chart.sunrise.sunriseUtc)).toBeLessThan(Date.parse(chart.sunrise.eventUtc));
    expect(chart.sunrise.elapsedHours).toBeLessThan(25);
    expect(() => runSimulationEvent({ ...fixture, location: "Unknown venue", latitude: undefined, longitude: undefined })).toThrow(/verified latitude/);
    expect(() => runSimulationEvent({ ...fixture, latitude: undefined })).toThrow(/both latitude/);
    expect(() => runSimulationEvent({ ...fixture, latitude: 100 })).toThrow(/latitude/);
    expect(() => runSimulationEvent({ ...fixture, sunriseTime: "2026-11-02T13:00:00Z", sunriseSource: "manual" })).toThrow(/precede/);
    expect(() => runSimulationEvent({ ...fixture, sunriseTime: "2026-11-01T13:00:00Z" })).toThrow(/source/);
    expect(() => buildEventCartesianChart({ startTime: new Date("2026-12-21T18:00:00Z"), latitude: 89, longitude: 0 })).toThrow(/No sunrise/);
  });
});
