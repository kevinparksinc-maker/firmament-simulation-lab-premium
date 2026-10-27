/** Versioned, explicit coordinate contract for Simulation Lab Premium.
 * Never substitute J2000 right ascension for ecliptic longitude.
 * This module does not alter prediction weights or ephemeris calculations.
 */
export const COORDINATE_CONTRACT_VERSION = "fixed-star-v1" as const;
export type EquatorialJ2000 = Readonly<{ raDegrees: number; decDegrees: number }>;
export type EclipticJ2000 = Readonly<{ longitudeDegrees: number; latitudeDegrees: number }>;
export type FixedWheelPosition = Readonly<{ longitudeDegrees: number; anchorOffsetDegrees: number }>;
const radians = (degrees: number) => degrees * Math.PI / 180;
const degrees = (radiansValue: number) => radiansValue * 180 / Math.PI;
export const normalizeLongitude = (value: number) => {
  if (!Number.isFinite(value)) throw new Error("Longitude must be finite");
  return ((value % 360) + 360) % 360;
};
/** Actual mean obliquity of the J2000 reference ecliptic; distinct from a user-defined zero-tilt wheel. */
export const J2000_MEAN_OBLIQUITY_DEGREES = 23.439291111;
export function equatorialJ2000ToEcliptic(position: EquatorialJ2000): EclipticJ2000 {
  if (!Number.isFinite(position.raDegrees) || !Number.isFinite(position.decDegrees) || Math.abs(position.decDegrees) > 90)
    throw new Error("Invalid J2000 equatorial coordinates");
  const a = radians(position.raDegrees), d = radians(position.decDegrees);
  const e = radians(J2000_MEAN_OBLIQUITY_DEGREES);
  const x = Math.cos(d) * Math.cos(a);
  const y = Math.cos(d) * Math.sin(a);
  const z = Math.sin(d);
  const ye = y * Math.cos(e) + z * Math.sin(e);
  const ze = -y * Math.sin(e) + z * Math.cos(e);
  return { longitudeDegrees: normalizeLongitude(degrees(Math.atan2(ye, x))), latitudeDegrees: degrees(Math.atan2(ze, Math.hypot(x, ye))) };
}
/** Deliberate custom wheel offset, not astronomical precession or an ayanamsa. */
export function toCustomFixedWheel(position: EclipticJ2000, anchorOffsetDegrees = 0): FixedWheelPosition {
  if (!Number.isFinite(position.latitudeDegrees) || Math.abs(position.latitudeDegrees) > 90) throw new Error("Invalid ecliptic latitude");
  return { longitudeDegrees: normalizeLongitude(position.longitudeDegrees + anchorOffsetDegrees), anchorOffsetDegrees };
}
export function equalHouseAtLongitude(longitudeDegrees: number, ascendantDegrees: number): { house: number; degreeIntoHouse: number } {
  const delta = normalizeLongitude(longitudeDegrees - ascendantDegrees);
  return { house: Math.floor(delta / 30) + 1, degreeIntoHouse: delta % 30 };
}
export type FixedStarCatalogRecord = Readonly<{
  id: string; name: string; source: string; epoch: "J2000"; frame: "ICRS" | "FK5_J2000";
  raDegrees: number; decDegrees: number; babylonianAttribution?: string;
}>;
export function validateFixedStarCatalog(stars: readonly FixedStarCatalogRecord[]): void {
  const ids = new Set<string>();
  for (const star of stars) {
    if (!star.id.trim() || !star.name.trim() || !star.source.trim() || ids.has(star.id)) throw new Error("Missing or duplicate star identity/source");
    ids.add(star.id);
    if (star.epoch !== "J2000" || !["ICRS", "FK5_J2000"].includes(star.frame)) throw new Error("Unsupported star frame");
    equatorialJ2000ToEcliptic({ raDegrees: star.raDegrees, decDegrees: star.decDegrees });
  }
}
