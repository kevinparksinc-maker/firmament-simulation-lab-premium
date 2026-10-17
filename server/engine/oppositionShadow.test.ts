import { describe, expect, it } from "vitest";
import { buildOppositionShadow, opposite, shadowHouse, shadowSide } from "./oppositionShadow";
describe("180 degree opposition shadow reference wheel", () => {
  it("rotates every house to its opposite and swaps the ascendant axis", () => {
    for (let house = 1; house <= 12; house++) {
      expect(shadowHouse(shadowHouse(house))).toBe(house);
      expect(shadowSide(shadowHouse(house))).not.toBe(shadowSide(house));
    }
    expect(opposite(350)).toBe(170);
    expect(opposite(0)).toBe(180);
  });
  it("does not alter actual planetary tropical ephemeris positions", () => {
    const chart = {
      ascendantLongitude: 20,
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, cuspLongitude: (20 + i * 30) % 360 })),
      planets: [{ planet: "Mars", tropicalLongitude: 105, backgroundWheelLongitude: 105, house: 3, nakshatra: "Ashlesha" }],
    };
    const shadow = buildOppositionShadow(chart);
    expect(shadow.ascendantLongitude).toBe(200);
    expect(shadow.planets[0].tropicalLongitude).toBe(105);
    expect(shadow.planets[0].house).toBe(9);
    expect(shadow.planets[0].shadowReferenceLongitude).toBe(285);
    expect(shadow.houses[0].cuspLongitude).toBe(200);
    expect(chart.planets[0].house).toBe(3);
  });
});
