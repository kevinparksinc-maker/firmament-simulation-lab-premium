export const DAWN_ASCENDANT_MODEL = "fixed-earth-dawn-anchored" as const;

export type DawnAnchoredAscendantInput = {
  birthOrEventTime: string | Date;
  sunriseTime: string | Date;
  sunEclipticLongitude: number;
  sunriseSource?: string;
};

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
] as const;

function formatDegreeMinuteSign(longitude: number): string {
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degreeTotal = norm % 30;
  const degrees = Math.floor(degreeTotal);
  const minutes = Math.round((degreeTotal - degrees) * 60);
  return `${degrees}°${minutes.toString().padStart(2, "0")}′ ${ZODIAC_SIGNS[signIndex]}`;
}

export function calculateDawnAnchoredAscendant(input: DawnAnchoredAscendantInput) {
  const eventTime = new Date(input.birthOrEventTime);
  const sunrise = new Date(input.sunriseTime);
  const minutesElapsed = Math.round((eventTime.getTime() - sunrise.getTime()) / 60000);
  // 1 degree per 4 minutes = 0.25 degrees per minute
  const rotationDegrees = minutesElapsed * 0.25;
  const rawAscendant = ((input.sunEclipticLongitude + rotationDegrees) % 360 + 360) % 360;

  const houses = Array.from({ length: 12 }, (_, i) => {
    const cusp = (rawAscendant + i * 30) % 360;
    return {
      house: i + 1,
      cuspLongitude: cusp,
      sign: ZODIAC_SIGNS[Math.floor(cusp / 30)],
    };
  });

  // Calculate sun house relative to ascendant
  const delta = ((input.sunEclipticLongitude - rawAscendant) % 360 + 360) % 360;
  const sunHouse = Math.floor(delta / 30) + 1;

  return {
    model: DAWN_ASCENDANT_MODEL,
    minutesElapsed,
    rotationDegrees,
    rawAscendant,
    ascendantLongitude: rawAscendant,
    formattedAscendant: formatDegreeMinuteSign(rawAscendant),
    sunHouse,
    sunriseTime: typeof input.sunriseTime === "string" ? input.sunriseTime : input.sunriseTime.toISOString(),
    sunriseSource: input.sunriseSource ?? "Observed astronomical ephemeris",
    houses,
  };
}
