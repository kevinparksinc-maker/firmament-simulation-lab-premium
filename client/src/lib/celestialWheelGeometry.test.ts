import { describe, expect, it } from "vitest";
import { equalHouseCenter, wheelPoint } from "./celestialWheelGeometry";

describe("counterclockwise equal-house wheel presentation", () => {
  it("keeps Aries 0° at twelve o'clock", () => {
    const p = wheelPoint(0, 90);
    expect(p.x).toBeCloseTo(110);
    expect(p.y).toBeCloseTo(20);
  });
  it("draws longitude 30° counterclockwise of Aries rather than clockwise", () => {
    const p = wheelPoint(30, 90);
    expect(p.x).toBeLessThan(110);
    expect(p.y).toBeLessThan(110);
    const reverse = wheelPoint(330, 90);
    expect(reverse.x).toBeGreaterThan(110);
  });
  it("advances every next 30° equal house counterclockwise", () => {
    expect(equalHouseCenter(0, 1)).toBe(15);
    expect(equalHouseCenter(0, 2)).toBe(45);
    const first = wheelPoint(equalHouseCenter(0, 1), 60);
    const second = wheelPoint(equalHouseCenter(0, 2), 60);
    expect(second.x).toBeLessThan(first.x);
    expect(equalHouseCenter(165, 12)).toBe(510);
  });
  it("wraps 0° and 360° on the same celestial radial axis", () => {
    const a = wheelPoint(0, 80);
    const b = wheelPoint(360, 80);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
  });
});
