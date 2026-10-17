export function shadowReferenceLongitude(longitude: number) { return ((longitude + 180) % 360 + 360) % 360; }
import { NAKSHATRAS, ARABIC_LUNAR_MANSIONS, kpDetailsFromCanonicalLongitude } from "./firmamentEngine";
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export function shadowReferenceIdentities(longitude: number) {
  const value = shadowReferenceLongitude(longitude);
  const kp = kpDetailsFromCanonicalLongitude(value, new Date(0), false);
  return { referenceLongitude: value, sign: SIGNS[Math.floor(value / 30)]!,
    decan: Math.floor((value % 30) / 10) + 1,
    nakshatra: NAKSHATRAS[Math.floor(value / (360 / 27))]!,
    manzil: ARABIC_LUNAR_MANSIONS[Math.floor(value / (360 / 28))]!,
    starLord: kp.starLord, subLord: kp.subLord };
}
