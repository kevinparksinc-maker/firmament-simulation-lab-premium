/**
 * FIRMAMENT 360° CORE / ZODIAC-ORDERED EQUAL HOUSES V3
 *
 * Immutable ecliptic-label geometry: Aries → Taurus → Gemini → ... → Pisces.
 * An Ascendant inside Aries starts H1. The NEXT 30° sector is H2 (Taurus
 * when the Ascendant is exactly 0° Aries); the PREVIOUS sector is H12 (Pisces).
 *
 * Geometry is independent of any astronomical ephemeris or belief about tilt:
 * callers MUST already have positions and an Ascendant in one declared frame.
 * A separate wheel renderer controls visual orientation (counterclockwise).
 *
 * Do not confuse sign index with house index if the Ascendant has a nonzero
 * degree in its sign. H1 at 25° Taurus runs through 25° Gemini.
 */
export const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;
export const WHEEL_GEOMETRY_VERSION = "ZODIAC_FORWARD_HOUSE_1_TO_12_V3" as const;
export const HOUSE_ARC_DEGREES = 30;
export const WHEEL_ARC_DEGREES = 360;

export type FirmamentFrame = "god" | "agent";
export type HousePosition = { house: number; startLongitude: number; endLongitude: number; degreeInHouse: number };
export type LongitudeArc = { startLongitude: number; endLongitude: number };
export type HouseOverlap = { house: number; startLongitude: number; endLongitude: number; degrees: number };

export function normalizeLongitude(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new RangeError("Longitude must be finite");
  return ((degrees % WHEEL_ARC_DEGREES) + WHEEL_ARC_DEGREES) % WHEEL_ARC_DEGREES;
}

export function zodiacAt(longitude: number) {
  const degrees = normalizeLongitude(longitude);
  const index = Math.floor(degrees / HOUSE_ARC_DEGREES);
  return { index, name: ZODIAC_SIGNS[index]!, degreeInSign: degrees % HOUSE_ARC_DEGREES };
}

export function houseAnchor(frame: FirmamentFrame, ascendantLongitude: number): number {
  return frame === "god" ? 0 : normalizeLongitude(ascendantLongitude);
}

export function houseCusp(house: number, frame: FirmamentFrame, ascendantLongitude: number): number {
  if (!Number.isInteger(house) || house < 1 || house > 12) throw new RangeError("House must be 1 through 12");
  return normalizeLongitude(houseAnchor(frame, ascendantLongitude) + (house-1)*HOUSE_ARC_DEGREES);
}

export function locateInHouse(longitude: number, frame: FirmamentFrame, ascendantLongitude: number): HousePosition {
  const relative = normalizeLongitude(longitude-houseAnchor(frame,ascendantLongitude));
  const house = Math.floor(relative/HOUSE_ARC_DEGREES)+1;
  return {
    house,
    startLongitude: houseCusp(house,frame,ascendantLongitude),
    endLongitude: houseCusp(house===12 ? 1 : house+1,frame,ascendantLongitude),
    degreeInHouse: relative%HOUSE_ARC_DEGREES,
  };
}

/** Fixed zodiac arc assigned to rotating house frame; conserves total width. */
export function arcHouseOverlaps(arc: LongitudeArc, frame: FirmamentFrame, ascendantLongitude: number): HouseOverlap[] {
  const width=arc.endLongitude-arc.startLongitude;
  if(!Number.isFinite(width)||width<=0||width>WHEEL_ARC_DEGREES) throw new RangeError("Arc must have positive span no greater than 360°");
  const start=normalizeLongitude(arc.startLongitude);
  const anchor=houseAnchor(frame,ascendantLongitude);
  const relativeStart=normalizeLongitude(start-anchor);
  const relativeEnd=relativeStart+width;
  const overlaps:HouseOverlap[]=[];
  for(let index=0;index<12;index++){
    for(let cycle=0;cycle<2;cycle++){
      const lower=index*HOUSE_ARC_DEGREES+cycle*WHEEL_ARC_DEGREES;
      const upper=lower+HOUSE_ARC_DEGREES;
      const left=Math.max(relativeStart,lower),right=Math.min(relativeEnd,upper);
      if(right>left)overlaps.push({
        house:index+1,
        startLongitude:normalizeLongitude(anchor+left),
        endLongitude:normalizeLongitude(anchor+right),
        degrees:right-left,
      });
    }
  }
  return overlaps.sort((a,b)=>normalizeLongitude(a.startLongitude-start)-normalizeLongitude(b.startLongitude-start));
}

/** Historical reverse-numbered 1,12,11,..2 calculation ONLY for old-run audits.
 * MUST NOT enter live or experimental V3 prediction calculations.
 */
export function legacyReverseHouse(longitude:number, frame:FirmamentFrame, ascendantLongitude:number):number {
  const sector=Math.floor(normalizeLongitude(longitude-houseAnchor(frame,ascendantLongitude))/HOUSE_ARC_DEGREES);
  return sector===0?1:13-sector;
}

/** Visual locations: zero longitude at 12 o'clock; forward zodiac degrees
 * advance COUNTERCLOCKWISE. SVG Y axis points down, so negate the angle.
 */
export function counterclockwiseWheelAngle(longitude:number):number {
  return -(normalizeLongitude(longitude)+90);
}

/**
 * Project an unchanged 12-sign dataset into exact-degree 30° equal houses.
 * This is a MEASURED OVERLAP of signs with houses, not a whole-sign mapping.
 * When Ascendant is 25° Taurus, H1 contains Taurus 25°..30° (5°)
 * AND Gemini 0°..25° (25°). Each sign's original value stays unchanged.
 *
 * For any array of per-sign values, conservation holds:
 *   Σ house weightedValue === Σ source sign values.
 */
export function projectSignValuesToEqualHouses(
  signValues: readonly number[],
  frame: FirmamentFrame,
  ascendantLongitude: number,
): Array<{
  house: number;
  startLongitude: number;
  weightedValue: number;
  signContributions: Array<{
    sign: typeof ZODIAC_SIGNS[number];
    signIndex: number;
    degrees: number;
    fractionOfHouse: number;
    rawSignValue: number;
    weightedContribution: number;
  }>;
}> {
  if (signValues.length !== 12 || !signValues.every(Number.isFinite))
    throw new RangeError("Must provide exactly 12 finite, fixed zodiac sign values");
  const result = Array.from({ length: 12 }, (_, i) => ({
    house: i+1,
    startLongitude: houseCusp(i+1, frame, ascendantLongitude),
    weightedValue: 0,
    signContributions: [] as Array<{
      sign: typeof ZODIAC_SIGNS[number];signIndex:number;degrees:number;
      fractionOfHouse:number;rawSignValue:number;weightedContribution:number;
    }>,
  }));
  for (let signIndex=0;signIndex<12;signIndex++) {
    const value=signValues[signIndex]!;
    const overlaps=arcHouseOverlaps({
      startLongitude:signIndex*HOUSE_ARC_DEGREES,
      endLongitude:(signIndex+1)*HOUSE_ARC_DEGREES,
    },frame,ascendantLongitude);
    for (const overlap of overlaps) {
      const fraction=overlap.degrees/HOUSE_ARC_DEGREES;
      const weightedContribution=value*fraction;
      const record=result[overlap.house-1]!;
      record.weightedValue+=weightedContribution;
      record.signContributions.push({
        sign:ZODIAC_SIGNS[signIndex]!,signIndex,
        degrees:overlap.degrees,fractionOfHouse:fraction,
        rawSignValue:value,weightedContribution,
      });
    }
  }
  return result;
}
