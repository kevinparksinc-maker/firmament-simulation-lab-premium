/** Guardian parity adapter. Guardian's actual source is Swiss Ephemeris mode 14.
 * The Premium astronomy-engine longitudes are NOT interchangeable with these.
 * No fallback to a different zodiac is permitted.
 */
import { guardianOverlay, GUARDIAN_REFERENCE_FRAME } from "./guardianFixedCanon";

export const GUARDIAN_SIDEREAL_MODE = 14 as const;
export type GuardianCanonicalPosition = {
  planet: string;
  longitude: number;
  referenceFrame: typeof GUARDIAN_REFERENCE_FRAME;
  source: "guardian-swiss-ephemeris-mode-14";
  /** UTC instant for which the longitude was computed. */
  timestamp?: string;
};
export type GuardianCanonicalProvider = (date: Date, planet: string) => GuardianCanonicalPosition;
export function requireGuardianPosition(provider: GuardianCanonicalProvider, date: Date, planet: string) {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid event date");
  const result = provider(date, planet);
  if (!result || typeof result !== "object") throw new Error("Guardian canonical provider returned no position");
  if (result.timestamp !== undefined && (!Number.isFinite(Date.parse(result.timestamp)) || new Date(result.timestamp).getTime() !== date.getTime()))
    throw new Error("Guardian canonical position timestamp does not match requested instant");
  if (result.planet !== planet || result.referenceFrame !== GUARDIAN_REFERENCE_FRAME ||
      result.source !== "guardian-swiss-ephemeris-mode-14" ||
      !Number.isFinite(result.longitude) || result.longitude < 0 || result.longitude >= 360)
    throw new Error("Guardian mode-14 canonical position required; do not fall back to another frame");
  return { ...result, overlay: guardianOverlay(result.longitude) };
}
