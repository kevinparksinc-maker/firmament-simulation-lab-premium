import { ascendantFromSunrise, normalizeDegrees, solarAnglesFromFixedXYZ, type FixedVector } from "./absoluteSunriseAscendant";

export type CartesianEventInput = {
  eventUtc: string;
  sunriseUtc: string;
  sunriseSunXYZ: FixedVector;
  latitude: number;
  bodiesXYZ: Record<string, FixedVector>;
  frameId: string;
};

export function buildCartesianEventChart(input: CartesianEventInput) {
  if (!input.frameId.trim()) throw new Error("XYZ frame ID is required");
  if (Object.keys(input.bodiesXYZ).length === 0) throw new Error("XYZ planetary vectors are required");
  const sunrise = ascendantFromSunrise(input);
  const ascendant = sunrise.ascendant;
  const planets = Object.fromEntries(Object.entries(input.bodiesXYZ).map(([name, vector]) => {
    const angles = solarAnglesFromFixedXYZ(vector);
    return [name, { ...angles, house: Math.floor(normalizeDegrees(angles.longitude - ascendant) / 30) + 1 }];
  }));
  return {
    frameId: input.frameId,
    source: "fixed-cartesian-xyz" as const,
    ascendant,
    descendant: normalizeDegrees(ascendant + 180),
    houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, cusp: normalizeDegrees(ascendant + i * 30) })),
    planets,
    sunrise,
  };
}
