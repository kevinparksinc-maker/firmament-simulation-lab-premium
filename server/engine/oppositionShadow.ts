/** Counterfactual 180-degree celestial reference wheel. Never changes the real ephemeris. */
export const SHADOW_ROTATION = 180;
export const ASC_HOUSES = [1, 2, 3, 6, 10, 11] as const;
export const DSC_HOUSES = [4, 5, 7, 8, 9, 12] as const;
export const normalize360 = (degrees: number) => ((degrees % 360) + 360) % 360;
export const opposite = (degrees: number) => normalize360(degrees + SHADOW_ROTATION);
export const shadowHouse = (house: number) => ((house + 5) % 12) + 1;
export type ShadowPlanet = { planet: string; tropicalLongitude: number; backgroundWheelLongitude: number; house: number; nakshatra: string; [key: string]: unknown };
export type ShadowChart<T extends { ascendantLongitude: number; houses: Array<{ house: number; cuspLongitude: number; [key: string]: unknown }>; planets: ShadowPlanet[] }> = Omit<T, "planets"> & {
  shadowMode: "reference-wheel-180";
  referenceRotationDegrees: 180;
  originalAscendantLongitude: number;
  originalDescendantLongitude: number;
  planets: Array<ShadowPlanet & { originalHouse: number; originalBackgroundWheelLongitude: number; shadowReferenceLongitude: number }>;
};
/** Houses and celestial boundaries are shifted against unmodified planetary longitudes.
 * Shadow-relative longitude represents the planet against the rotated wheel, not a new ephemeris position.
 */
export function buildOppositionShadow<T extends { ascendantLongitude: number; houses: Array<{ house: number; cuspLongitude: number; [key: string]: unknown }>; planets: ShadowPlanet[] }>(chart: T): ShadowChart<T> {
  return {
    ...chart,
    shadowMode: "reference-wheel-180",
    referenceRotationDegrees: 180,
    originalAscendantLongitude: chart.ascendantLongitude,
    originalDescendantLongitude: opposite(chart.ascendantLongitude),
    ascendantLongitude: opposite(chart.ascendantLongitude),
    houses: chart.houses.map(house => ({ ...house, cuspLongitude: opposite(house.cuspLongitude) })),
    planets: chart.planets.map(planet => ({
      ...planet,
      originalHouse: planet.house,
      originalBackgroundWheelLongitude: planet.backgroundWheelLongitude,
      shadowReferenceLongitude: opposite(planet.backgroundWheelLongitude),
      house: shadowHouse(planet.house),
      // Actual tropical and original stellar identifiers are retained as audit evidence.
      // Shadow-specific mansion, decan, stellar rulership must be derived from shadowReferenceLongitude by their respective calculators.
    })),
  } as ShadowChart<T>;
}
export function shadowSide(house: number): "A" | "B" {
  return (ASC_HOUSES as readonly number[]).includes(house) ? "A" : "B";
}
