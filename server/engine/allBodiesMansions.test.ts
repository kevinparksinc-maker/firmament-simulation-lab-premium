import { describe, expect, it } from "vitest";
import { houseCusp, locateInHouse } from "./houseFrameFoundation";
import { ARABIC_LUNAR_MANSIONS, manzilFromLongitude, NAKSHATRA_ARC_DEGREES, NAKSHATRAS } from "./firmamentEngine";

const ALL_BODIES = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","Rahu","Ketu"] as const;

describe("all-planet and lunar-node celestial territory coverage", () => {
  it("assigns all 12 chart bodies and nodes a house and mansion in both views", () => {
    ALL_BODIES.forEach((planet, index) => {
      const longitude = ((index * 31 + 7) % 360);
      const mansion = manzilFromLongitude(longitude);
      const nakshatraIndex = Math.floor(longitude / NAKSHATRA_ARC_DEGREES);
      expect(mansion.name, planet).toBe(ARABIC_LUNAR_MANSIONS[mansion.index - 1]);
      expect(NAKSHATRAS[nakshatraIndex], planet).toBeDefined();
      expect(locateInHouse(longitude, "god", 0).house).toBeGreaterThanOrEqual(1);
      expect(locateInHouse(longitude, "agent", 47).house).toBeLessThanOrEqual(12);
    });
  });
  it("the 12 house cusps never change between method evaluations within one frame", () => {
    const cusps = Array.from({ length: 12 }, (_, i) => houseCusp(i+1, "agent", 47));
    expect(cusps).toEqual(Array.from({length:12},(_,i)=>(47+i*30)%360));
  });
});
