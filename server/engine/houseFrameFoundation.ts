/**
 * Firmament 360° house foundation.
 *
 * Every longitude is measured in the same 0° Aries-origin coordinate system.
 * God View fixes the equal-house anchor at 0° Aries; Agent View changes ONLY
 * the anchor to the event's computed Ascendant. The ephemeris value is not
 * rotated to force a house or a visual placement.
 *
 * IMPORTANT: Do not mix tropical-of-date, sidereal, and background-frame
 * longitudes. The caller must pass the planet longitude and ascendant in the
 * SAME coordinate frame (same zodiac/epoch/ayanamsa).
 */
export type FirmamentFrame = "god" | "agent";
export type HousePosition = {
  house: number;
  startLongitude: number;
  endLongitude: number;
  degreeInHouse: number;
};
export type LongitudeArc = { startLongitude: number; endLongitude: number };
export type HouseOverlap = { house: number; startLongitude: number; endLongitude: number; degrees: number };

export function normalizeLongitude(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new RangeError("Longitude must be finite");
  return ((degrees % 360) + 360) % 360;
}

export function houseAnchor(frame: FirmamentFrame, ascendantLongitude: number): number {
  return frame === "god" ? 0 : normalizeLongitude(ascendantLongitude);
}

export function houseCusp(house: number, frame: FirmamentFrame, ascendantLongitude: number): number {
  if (!Number.isInteger(house) || house < 1 || house > 12) throw new RangeError("House must be 1 through 12");
  return normalizeLongitude(houseAnchor(frame, ascendantLongitude) + ((13 - house) % 12) * 30);
}

export function locateInHouse(longitude: number, frame: FirmamentFrame, ascendantLongitude: number): HousePosition {
  const relative = normalizeLongitude(longitude - houseAnchor(frame, ascendantLongitude));
  const segment = Math.floor(relative / 30);
  const house = segment === 0 ? 1 : 13 - segment;
  return {
    house,
    startLongitude: houseCusp(house, frame, ascendantLongitude),
    endLongitude: houseCusp(house === 1 ? 12 : house - 1, frame, ascendantLongitude),
    degreeInHouse: relative % 30,
  };
}

/** Return exact house coverage for zodiac-based decans and lunar mansion arcs.
 * Input arcs are forward-moving zodiac longitude intervals; they may wrap at 360°.
 * A full-circle interval is not representable here.
 */
export function arcHouseOverlaps(arc: LongitudeArc, frame: FirmamentFrame, ascendantLongitude: number): HouseOverlap[] {
  const start = normalizeLongitude(arc.startLongitude);
  const rawDistance = arc.endLongitude - arc.startLongitude;
  if (!Number.isFinite(rawDistance) || rawDistance <= 0 || rawDistance > 360) {
    throw new RangeError("Arc must have positive span no greater than 360°");
  }
  const offsets = normalizeLongitude(start - houseAnchor(frame, ascendantLongitude));
  const end = offsets + rawDistance;
  const overlaps: HouseOverlap[] = [];
  for (let h = 0; h < 12; h += 1) {
    for (let cycle = 0; cycle <= 1; cycle += 1) {
      const lower = h * 30 + cycle * 360;
      const upper = lower + 30;
      const left = Math.max(offsets, lower);
      const right = Math.min(end, upper);
      if (right > left) {
        overlaps.push({
          house: h === 0 ? 1 : 13 - h,
          startLongitude: normalizeLongitude(houseAnchor(frame, ascendantLongitude) + left),
          endLongitude: normalizeLongitude(houseAnchor(frame, ascendantLongitude) + right),
          degrees: right - left,
        });
      }
    }
  }
  return overlaps.sort((a, b) => normalizeLongitude(a.startLongitude - start) - normalizeLongitude(b.startLongitude - start));
}
