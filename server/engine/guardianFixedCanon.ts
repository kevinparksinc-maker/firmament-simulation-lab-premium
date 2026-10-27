/** Canonical fixed-firmament overlay copied from Guardian's shared/hybrid.ts.
 * Symbolic locked zodiac degrees, not historical observed stellar coordinates.
 * No J2000 positions or precession corrections are applied here.
 */
export const GUARDIAN_REFERENCE_FRAME = "firmament-aldebaran-15-taurus" as const;
export const GUARDIAN_FIXED_STARS = [
  ["Hamal", 12.9333], ["Algol", 31.4333], ["Aldebaran", 45], ["Rigel", 52.1], ["Polaris", 63.8333],
  ["Sirius", 79.35], ["Regulus", 135], ["Spica", 179.1], ["Antares", 225.0167], ["Fomalhaut", 315],
] as const;
export const GUARDIAN_ELEMENTAL_DECAN_SIGNS = [
  ["Aries","Leo","Sagittarius"],["Taurus","Virgo","Capricorn"],["Gemini","Libra","Aquarius"],
  ["Cancer","Scorpio","Pisces"],["Leo","Sagittarius","Aries"],["Virgo","Capricorn","Taurus"],
  ["Libra","Aquarius","Gemini"],["Scorpio","Pisces","Cancer"],["Sagittarius","Aries","Leo"],
  ["Capricorn","Taurus","Virgo"],["Aquarius","Gemini","Libra"],["Pisces","Cancer","Scorpio"],
] as const;
export const GUARDIAN_MANZILS = [
  "Al-Sharatain","Al-Butain","Al-Thurayya","Al-Dabaran","Al-Haq’ah","Al-Han’ah",
  "Al-Dhira’","Al-Nathrah","Al-Tarf","Al-Jabhah","Al-Zubrah","Al-Sarfah",
  "Al-Awwa’","Al-Simak","Al-Ghafr","Al-Zubana","Al-Iklil","Al-Qalb",
  "Al-Shaula","Al-Na’am","Al-Baldah","Sa’d al-Dhabih","Sa’d Bula’",
  "Sa’d al-Su’ud","Sa’d al-Akhbiya","Al-Fargh al-Muqaddam",
  "Al-Fargh al-Mu’akhkhar","Al-Risha/Batn al-Hut",
] as const;
export const normalizeGuardianLongitude = (degrees: number) => {
  if (!Number.isFinite(degrees)) throw new RangeError("Invalid longitude");
  return ((degrees % 360) + 360) % 360;
};
export function guardianOverlay(longitude: number) {
  const l = normalizeGuardianLongitude(longitude);
  const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"] as const;
  const decanIndex = Math.floor(l / 10);
  const signIndex = Math.floor(l / 30);
  return {
    sign: signs[signIndex],
    decan: GUARDIAN_ELEMENTAL_DECAN_SIGNS[signIndex][decanIndex % 3],
    manzil: GUARDIAN_MANZILS[Math.floor(l / (360 / 28))],
    fixedStars: GUARDIAN_FIXED_STARS.map(([name, fixedLongitude]) => ({
      name, fixedLongitude, separationDegrees: Math.min(normalizeGuardianLongitude(l - fixedLongitude), normalizeGuardianLongitude(fixedLongitude - l)),
    })),
  };
}
