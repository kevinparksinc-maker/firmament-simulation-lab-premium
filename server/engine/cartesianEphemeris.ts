import { createRequire } from "node:module";
import { buildCartesianEventChart } from "./cartesianEventChart";
import { solarAnglesFromFixedXYZ, type FixedVector } from "./absoluteSunriseAscendant";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof import("astronomy-engine");
export const CARTESIAN_FRAME_ID = "absolute-fixed-equatorial-xyz-v1";
export const XYZ_PROVENANCE = Object.freeze({
  provider: "astronomy-engine@2.1.19",
  operation: "GeoVector(body, instant, false)",
  // Name the provider basis honestly; this is not an ecliptic zodiac conversion.
  nativeBasis: "EQJ: J2000 equatorial Cartesian axes",
  projection: "atan2(y,x); zero tilt; no precession, ayanamsa or zodiac conversion",
  units: "AU",
  nodes: "mean-node polynomial 125.04452 − 0.0529538083 × days since 2000-01-01T12:00Z; opposite XY unit vectors (not GeoVector bodies)",
});

export function validateObserver(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180)
    throw new Error("Valid observer latitude and longitude are required for sunrise.");
}

/** Sunrise-model altitude for sect. This diagnostic never determines the ASC. */
export function cartesianAltitude(vector: FixedVector, chart: ReturnType<typeof buildEventCartesianChart>) {
  const rad = Math.PI / 180;
  const sun = solarAnglesFromFixedXYZ(chart.sunriseSunXYZ);
  const body = solarAnglesFromFixedXYZ(vector);
  const latitude = chart.latitude * rad;
  const cosineHourAngle = -Math.tan(latitude) * Math.tan(sun.declination * rad);
  if (!Number.isFinite(cosineHourAngle) || Math.abs(cosineHourAngle) > 1)
    throw new Error("No geometric sunrise horizon available for sect at this observer.");
  const meridian = sun.longitude * rad - Math.acos(cosineHourAngle) + chart.sunrise.elapsedRotationDegrees * rad;
  const hourAngle = meridian - body.longitude * rad;
  const altitude = Math.sin(latitude) * Math.sin(body.declination * rad) + Math.cos(latitude) * Math.cos(body.declination * rad) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, altitude))) / rad;
}

export function generateCartesianVectors(date: Date): Record<string, FixedVector> {
  if (!Number.isFinite(date.getTime())) throw new Error("Valid ephemeris instant required.");
  const vectors: Record<string, FixedVector> = {};
  for (const name of ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const) {
    const { x, y, z } = Astronomy.GeoVector(Astronomy.Body[name], date, false);
    vectors[name] = { x, y, z };
  }
  // Preserve the existing mean-node model, expressed directly as an XY vector.
  // The epoch is solely the origin of the mean-node polynomial, not a zodiac transform.
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const angle = (125.04452 - 0.0529538083 * days) * Math.PI / 180;
  vectors.Rahu = { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
  vectors.Ketu = { x: -vectors.Rahu.x, y: -vectors.Rahu.y, z: 0 };
  for (const vector of Object.values(vectors)) solarAnglesFromFixedXYZ(vector);
  return vectors;
}

export function buildEventCartesianChart(input: {
  startTime: Date;
  latitude: number;
  longitude: number;
  sunriseTime?: Date;
  sunriseSource?: string;
}) {
  validateObserver(input.latitude, input.longitude);
  if (!Number.isFinite(input.startTime.getTime())) throw new Error("Valid event instant required.");
  let sunrise = input.sunriseTime;
  let sunriseSource = input.sunriseSource;
  if (sunrise) {
    if (!sunriseSource?.trim()) throw new Error("A supplied sunrise requires its source.");
  } else {
    // Latest sunrise at or before the event also supports events before local dawn.
    const found = Astronomy.SearchRiseSet(Astronomy.Body.Sun, new Astronomy.Observer(input.latitude, input.longitude, 0), 1, input.startTime, -25 / 24);
    if (!found) throw new Error("No sunrise within 25 hours before this event at this location.");
    sunrise = found.date;
    sunriseSource = "Astronomy Engine SearchRiseSet: solar upper limb, standard refraction, sea-level observer";
  }
  const bodiesXYZ = generateCartesianVectors(input.startTime);
  const sunriseSunXYZ = generateCartesianVectors(sunrise).Sun!;
  const chart = buildCartesianEventChart({ eventUtc: input.startTime.toISOString(), sunriseUtc: sunrise.toISOString(), sunriseSunXYZ, latitude: input.latitude, bodiesXYZ, frameId: CARTESIAN_FRAME_ID });
  return { ...chart, sunriseSource: sunriseSource!, latitude: input.latitude, longitude: input.longitude, bodiesXYZ, sunriseSunXYZ, provenance: XYZ_PROVENANCE };
}
