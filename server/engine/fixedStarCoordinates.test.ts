import { describe, expect, it } from "vitest";
import { equatorialJ2000ToEcliptic, equalHouseAtLongitude, toCustomFixedWheel, validateFixedStarCatalog } from "./fixedStarCoordinates";
describe("fixed-star coordinate contract", () => {
  it("distinguishes RA from ecliptic longitude", () => {
    const result = equatorialJ2000ToEcliptic({ raDegrees: 90, decDegrees: 0 });
    expect(result.longitudeDegrees).toBeCloseTo(90, 8);
    expect(result.latitudeDegrees).toBeCloseTo(-23.439291111, 6);
  });
  it("wraps the fixed wheel and anchors equal houses at the ascendant", () => {
    expect(toCustomFixedWheel({ longitudeDegrees: 355, latitudeDegrees: 0 }, 10).longitudeDegrees).toBe(5);
    expect(equalHouseAtLongitude(5, 275)).toEqual({ house: 4, degreeIntoHouse: 0 });
    expect(equalHouseAtLongitude(274.5, 275).house).toBe(12);
  });
  it("rejects fabricated or incomplete source metadata", () => {
    expect(() => validateFixedStarCatalog([{ id: "a", name: "Star", source: "", epoch: "J2000", frame: "ICRS", raDegrees: 1, decDegrees: 0 }])).toThrow();
  });
});
