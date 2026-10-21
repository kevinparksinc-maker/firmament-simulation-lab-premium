/**
 * Fixed 36 elemental-family sign-ruler decans on the exact 360° zodiac wheel.
 * The decan never moves with the Ascendant; only its house overlap changes.
 *
 * Ruler order: own sign, then next and third sign in same element in zodiac order.\n * This catalog is independent of the chosen astronomical coordinate frame.
 * A caller must first provide a trusted longitude in the common zodiac wheel.
 */
import {
  ZODIAC_SIGNS, arcHouseOverlaps, normalizeLongitude, type FirmamentFrame,
} from "./firmamentWheel";

export const ELEMENTAL_DECAN_RULERS = [
  ["Mars", "Sun", "Jupiter"],       // Aries → Leo → Sagittarius
  ["Venus", "Mercury", "Saturn"],   // Taurus → Virgo → Capricorn
  ["Mercury", "Venus", "Saturn"],   // Gemini → Libra → Aquarius
  ["Moon", "Mars", "Jupiter"],     // Cancer → Scorpio → Pisces
  ["Sun", "Jupiter", "Mars"],      // Leo → Sagittarius → Aries
  ["Mercury", "Saturn", "Venus"],  // Virgo → Capricorn → Taurus
  ["Venus", "Saturn", "Mercury"],  // Libra → Aquarius → Gemini
  ["Mars", "Jupiter", "Moon"],     // Scorpio → Pisces → Cancer
  ["Jupiter", "Mars", "Sun"],      // Sagittarius → Aries → Leo
  ["Saturn", "Venus", "Mercury"],  // Capricorn → Taurus → Virgo
  ["Saturn", "Mercury", "Venus"],  // Aquarius → Gemini → Libra
  ["Jupiter", "Moon", "Mars"],     // Pisces → Cancer → Scorpio
] as const;

export type ElementalDecan = {
  number: number;  // 1 through 36
  sign: typeof ZODIAC_SIGNS[number];
  face: 1 | 2 | 3;
  ruler: string;
  startLongitude: number;
  endLongitude: number;  // 360° is retained for Pisces face 3
  degreeInFace: number; // unrounded, 0 to less than 10°
};

/** Never clamp an out-of-range input into the wrong decan. */
export function decanForSignDegree(sign: string, degreeInSign: number) {
  const index = ZODIAC_SIGNS.findIndex(candidate => candidate === sign);
  if (index < 0) throw new RangeError(`Unknown zodiac sign for decan: ${sign}`);
  if (!Number.isFinite(degreeInSign) || degreeInSign < 0 || degreeInSign >= 30) {
    throw new RangeError(`Decan's degree within ${sign} must be >= 0 and < 30`);
  }
  const faceIndex = Math.floor(degreeInSign / 10);
  return {
    decan: (faceIndex+1) as 1|2|3,
    ruler: ELEMENTAL_DECAN_RULERS[index]![faceIndex]!,
  };
}

export function decanAtLongitude(longitude: number): ElementalDecan {
  const wheelLongitude = normalizeLongitude(longitude);
  const numberIndex = Math.floor(wheelLongitude/10);
  const signIndex = Math.floor(numberIndex/3);
  const faceIndex = numberIndex%3;
  return {
    number: numberIndex+1,
    sign: ZODIAC_SIGNS[signIndex]!,
    face: (faceIndex+1) as 1|2|3,
    ruler: ELEMENTAL_DECAN_RULERS[signIndex]![faceIndex]!,
    startLongitude: numberIndex*10,
    endLongitude: (numberIndex+1)*10,
    degreeInFace: wheelLongitude%10,
  };
}

export const ALL_36_DECANS: readonly ElementalDecan[] = Object.freeze(
  Array.from({length:36},(_,i)=>decanAtLongitude(i*10)),
);

/** Exact decan-to-equal-house intersections. A face can cross house boundaries. */
export function decanHouseOverlaps(
  decanNumber: number,
  frame: FirmamentFrame,
  ascendantLongitude: number,
) {
  if(!Number.isInteger(decanNumber)||decanNumber<1||decanNumber>36) {
    throw new RangeError("Decan number must be 1 through 36");
  }
  const d=ALL_36_DECANS[decanNumber-1]!;
  return arcHouseOverlaps({
    startLongitude:d.startLongitude,
    endLongitude:d.endLongitude,
  },frame,ascendantLongitude);
}
