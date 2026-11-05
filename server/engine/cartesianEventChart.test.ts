import { describe, expect, it } from "vitest";
import { buildCartesianEventChart } from "./cartesianEventChart";

const base = {
  frameId: "absolute-fixed-equatorial",
  sunriseUtc: "2026-11-04T12:00:00.000Z",
  eventUtc: "2026-11-04T14:00:00.000Z",
  sunriseSunXYZ: { x: 1, y: 0, z: 0 },
  latitude: 42.8864,
  bodiesXYZ: { Sun: { x: 1, y: 0, z: 0 }, Moon: { x: 0, y: 1, z: 0 } },
};

describe("Cartesian event chart", () => {
  it("uses sunrise rotation for ASC and equal 30 degree cusps", () => {
    const chart = buildCartesianEventChart(base);
    expect(chart.ascendant).toBeCloseTo(30, 5);
    expect(chart.houses).toHaveLength(12);
    expect(chart.houses[1].cusp).toBeCloseTo(chart.ascendant + 30, 7);
    expect(chart.planets.Sun.house).toBe(12);
    expect(chart.planets.Moon.house).toBe(3);
  });
  it("requires explicit fixed-frame evidence", () => {
    expect(() => buildCartesianEventChart({ ...base, frameId: "" })).toThrow();
    expect(() => buildCartesianEventChart({ ...base, bodiesXYZ: {} })).toThrow();
  });
});
