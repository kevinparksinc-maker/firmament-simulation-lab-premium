import { describe, expect, it } from "vitest";
import { ascendantFromSunrise, solarAnglesFromFixedXYZ, SIDEREAL_DEGREES_PER_UTC_HOUR } from "./absoluteSunriseAscendant";

describe("The Absolute sunrise XYZ engine in Premium", () => {
  const sunriseUtc = "2026-11-04T12:00:00.000Z";
  const sunriseSunXYZ = { x: 0, y: 1, z: 0 };

  it("reads the fixed equatorial XYZ Sun angle", () => {
    expect(solarAnglesFromFixedXYZ(sunriseSunXYZ).longitude).toBe(90);
  });

  it("advances the sunrise anchor by sidereal rotation without J2000 conversion", () => {
    const result = ascendantFromSunrise({
      sunriseUtc,
      eventUtc: "2026-11-04T15:00:00.000Z",
      sunriseSunXYZ,
      latitude: 42.8864,
    });
    expect(result.sunriseHorizon).toBe(90);
    expect(result.elapsedHours).toBe(3);
    expect(result.ascendant).toBeCloseTo(90 + 3 * SIDEREAL_DEGREES_PER_UTC_HOUR, 8);
    expect(result.model).toBe("sun-equatorial-xyz-at-sunrise-plus-sidereal-rotation-v1");
  });

  it("rejects missing historical sunrise evidence instead of silently substituting a value", () => {
    expect(() => ascendantFromSunrise({
      sunriseUtc: "",
      eventUtc: "2026-11-04T15:00:00.000Z",
      sunriseSunXYZ,
      latitude: 42.8864,
    })).toThrow();
  });
});
