import { describe, expect, it } from "vitest";
import { buildHouseTerritoryCanon } from "./absoluteHouseTerritoryCanon";

describe("Absolute Canon territorial relationships", () => {
  const houses = Array.from({length: 12}, (_,i) => ({house:i+1,cuspLongitude:i*30}));
  it("assigns all twelve houses to the configured six-versus-six teams", () => {
    const result = buildHouseTerritoryCanon({houses,planets:[]}, "A Team", "B Team");
    expect(result.houses.filter(h => h.ownerSide === "A").map(h => h.house)).toEqual([1,2,3,6,10,11]);
    expect(result.houses.filter(h => h.ownerSide === "B").map(h => h.house)).toEqual([4,5,7,8,9,12]);
    expect(result.houses.every(h => h.significations.length > 0)).toBe(true);
  });
  it("traces planetary rulership across opposing territory without inventing scores", () => {
    const result = buildHouseTerritoryCanon({
      houses,
      planets:[{planet:"Mars",house:7,sign:"Libra"},{planet:"Moon",house:1,sign:"Aries"}],
    },"Home","Away");
    expect(result.houses[0].ruler).toBe("Mars");
    expect(result.houses[0].crossTerritoryRuler).toBe(true);
    expect(result.houses[0].rulerPlacement?.territorialTeam).toBe("Away");
    expect(result.houses[6].occupants).toContain("Mars");
    expect(result.status).toBe("interpretive-evidence-only");
  });
  it("uses the real cusp longitude, rather than assuming house 1 is Aries", () => {
    const shifted = houses.map(h=>({...h,cuspLongitude:(h.cuspLongitude+90)%360}));
    const result = buildHouseTerritoryCanon({houses:shifted,planets:[]}, "A", "B");
    expect(result.houses[0].cuspSign).toBe("Cancer");
    expect(result.houses[0].ruler).toBe("Moon");
  });
});
