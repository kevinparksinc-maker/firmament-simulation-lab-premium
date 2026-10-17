import { describe, expect, it } from "vitest";
import { distance, orbWeight, scoreOppositionShadow } from "./shadowScoring";
describe("shadow-specific reference calculations", () => {
  it("uses the five-degree orb and step weights", () => {
    expect(distance(359, 1)).toBe(2);
    expect(orbWeight(1)).toBe(1);
    expect(orbWeight(2)).toBe(0.8);
    expect(orbWeight(3)).toBe(0.6);
    expect(orbWeight(4)).toBe(0.4);
    expect(orbWeight(5)).toBe(0.2);
    expect(orbWeight(5.01)).toBe(0);
  });
  it("keeps tropical positions unchanged while recomputing shadow evidence", () => {
    const result = scoreOppositionShadow({
      planets: [{ planet: "Mars", house: 1, tropicalLongitude: 105, backgroundWheelLongitude: 105 }],
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, cuspLongitude: i * 30 })),
    });
    expect(result.planets[0].tropicalLongitude).toBe(105);
    expect(result.planets[0].shadowHouse).toBe(7);
    expect(result.methods.houseTerritory.B).toBe(1);
    expect(result.planets[0].referenceLongitude).toBe(285);
    expect(result.eligibleForProductionPrediction).toBe(false);
  });
});
