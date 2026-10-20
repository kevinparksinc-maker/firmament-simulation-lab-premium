import { describe, expect, it } from "vitest";
import type { Prediction } from "./firmamentEngine";
import { buildMethodChartSnapshot } from "./methodChartSnapshot";

function fakePrediction(): Prediction {
  return {
    ascendantLongitude: 47,
    planets: [{ planet: "Mars", backgroundWheelLongitude: 140, house: 1, degreeInHouse: 0 }],
    houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, cuspLongitude: i * 30 })),
  } as unknown as Prediction;
}

describe("single chart snapshot method foundation", () => {
  it("reprojects the SAME source longitude separately in God and Agent views", () => {
    const prediction = fakePrediction();
    const moment = new Date("2026-10-18T12:00:00Z");
    const god = buildMethodChartSnapshot(prediction, moment, "god");
    const agent = buildMethodChartSnapshot(prediction, moment, "agent", 47);
    expect(god.prediction.planets[0].backgroundWheelLongitude).toBe(140);
    expect(agent.prediction.planets[0].backgroundWheelLongitude).toBe(140);
    expect(god.prediction.planets[0].house).toBe(9);
    expect(agent.prediction.planets[0].house).toBe(10);
    expect(god.prediction.houses[0].cuspLongitude).toBe(0);
    expect(agent.prediction.houses[0].cuspLongitude).toBe(47);
    expect(prediction.planets[0].house).toBe(1); // never mutate upstream
  });
  it("freezes method evidence so methods cannot relocate planets", () => {
    const snapshot = buildMethodChartSnapshot(fakePrediction(), new Date("2026-10-18T12:00:00Z"), "agent");
    expect(Object.isFrozen(snapshot.prediction)).toBe(true);
    expect(Object.isFrozen(snapshot.prediction.planets[0])).toBe(true);
    expect(() => { snapshot.prediction.planets[0]!.house = 11; }).toThrow();
  });
});
