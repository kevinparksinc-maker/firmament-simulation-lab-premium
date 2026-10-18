import { describe, expect, it } from "vitest";
import { arcHouseOverlaps, houseCusp, locateInHouse, normalizeLongitude } from "./houseFrameFoundation";

describe("Firmament God/Agent unified 360° house foundation", () => {
  it("keeps 0° Aries fixed in God View", () => {
    expect(houseCusp(1, "god", 47)).toBe(0);
    expect(houseCusp(7, "god", 47)).toBe(180);
    expect(locateInHouse(140, "god", 47)).toMatchObject({ house: 5, degreeInHouse: 20 });
  });
  it("changes house assignments, never canonical planet longitude", () => {
    const longitude = 140;
    expect(locateInHouse(longitude, "agent", 100)).toMatchObject({ house: 2, degreeInHouse: 10 });
    expect(locateInHouse(longitude, "agent", 47)).toMatchObject({ house: 4, degreeInHouse: 3 });
    expect(longitude).toBe(140);
  });
  it("anchors Agent View exactly at the ascendant", () => {
    expect(houseCusp(1, "agent", 47)).toBe(47);
    expect(houseCusp(7, "agent", 47)).toBe(227);
    expect(houseCusp(12, "agent", 47)).toBe(17);
  });
  it("handles 0°/360° wrap and house-cusp boundaries", () => {
    expect(normalizeLongitude(-1)).toBe(359);
    expect(locateInHouse(359, "agent", 350).house).toBe(1);
    expect(locateInHouse(20, "agent", 350).house).toBe(2);
    expect(locateInHouse(47, "agent", 47).house).toBe(1);
  });
  it("maps zodiac subdivisions across every intersected house", () => {
    const overlap = arcHouseOverlaps({ startLongitude: 40, endLongitude: 60 }, "agent", 47);
    expect(overlap.map(x => [x.house, x.degrees])).toEqual([[12, 7], [1, 13]]);
    expect(overlap.reduce((sum, x) => sum + x.degrees, 0)).toBe(20);
  });
  it("rejects invalid longitude and house", () => {
    expect(() => normalizeLongitude(Number.NaN)).toThrow();
    expect(() => houseCusp(13, "god", 0)).toThrow();
  });
  it("partitions the entire zodiac into exactly twelve stable territories", () => {
    for (const anchor of [0, 17, 47, 100, 359]) {
      for (let h = 1; h <= 12; h++) {
        const cusp = houseCusp(h, "agent", anchor);
        expect(locateInHouse(cusp, "agent", anchor).house).toBe(h);
        const middle = normalizeLongitude(cusp + 15);
        expect(locateInHouse(middle, "agent", anchor).house).toBe(h);
      }
    }
  });
  it("preserves all exact zodiacal subdivision lengths when assigned to a frame", () => {
    for (const anchor of [0, 47, 359]) {
      for (const width of [10, 360 / 27, 360 / 28]) {
        for (let index = 0; index < 12; index++) {
          const startLongitude = index * 30 + 4;
          const overlaps = arcHouseOverlaps(
            { startLongitude, endLongitude: startLongitude + width },
            "agent", anchor
          );
          expect(overlaps.reduce((total, zone) => total + zone.degrees, 0)).toBeCloseTo(width, 9);
          expect(overlaps.every(zone => zone.house >= 1 && zone.house <= 12)).toBe(true);
        }
      }
    }
  });

});
