export const DAWN_ASCENDANT_MODEL = "fixed-earth-dawn-anchored" as const;
export type DawnAscendantModel = typeof DAWN_ASCENDANT_MODEL;

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type FormattedZodiac = {
  degrees: number;
  minutes: number;
  sign: (typeof ZODIAC_SIGNS)[number];
  displayString: string;
};

export type DawnHouseSegment = {
  houseNumber: number;
  startCusp: number;
  endCusp: number;
  displayString: string;
};

export type DawnAscendantResult = {
  model: DawnAscendantModel;
  sunriseSource: string;
  birthOrEventTime: string;
  sunriseTime: string;
  minutesElapsed: number;
  rotationDegrees: number;
  sunEclipticLongitude: number;
  rawAscendant: number;
  formattedAscendant: string;
  sunHouse: number;
  houses: DawnHouseSegment[];
};

function normalize(value: number) {
  return ((value % 360) + 360) % 360;
}

export function formatToZodiacString(rawDegrees: number): FormattedZodiac {
  const normalized = normalize(rawDegrees);
  const signIndex = Math.min(Math.floor(normalized / 30), 11);
  const sign = ZODIAC_SIGNS[signIndex]!;
  const degreeInSign = normalized - signIndex * 30;
  let degrees = Math.floor(degreeInSign);
  let minutes = Math.round((degreeInSign - degrees) * 60);
  if (minutes === 60) {
    degrees += 1;
    minutes = 0;
  }
  if (degrees === 30) {
    degrees = 0;
  }
  return {
    degrees,
    minutes,
    sign,
    displayString: `${degrees}°${minutes.toString().padStart(2, "0")}′ ${sign}`,
  };
}

export function calculateDawnAnchoredAscendant(input: {
  birthOrEventTime: Date;
  sunriseTime: Date;
  sunEclipticLongitude: number;
  sunriseSource?: string;
}): DawnAscendantResult {
  const minutesElapsed = (input.birthOrEventTime.getTime() - input.sunriseTime.getTime()) / (1000 * 60);
  const rotationDegrees = minutesElapsed / 4;
  const rawAscendant = normalize(input.sunEclipticLongitude + rotationDegrees);
  const houses: DawnHouseSegment[] = Array.from({ length: 12 }, (_, index) => {
    const startCusp = normalize(rawAscendant + index * 30);
    const endCusp = normalize(startCusp + 30);
    return {
      houseNumber: index + 1,
      startCusp,
      endCusp,
      displayString: formatToZodiacString(startCusp).displayString,
    };
  });
  const sunLongitude = normalize(input.sunEclipticLongitude);
  const sunHouse = houses.find(({ startCusp, endCusp }) => (
    startCusp < endCusp
      ? sunLongitude >= startCusp && sunLongitude < endCusp
      : sunLongitude >= startCusp || sunLongitude < endCusp
  ))?.houseNumber ?? -1;
  return {
    model: DAWN_ASCENDANT_MODEL,
    sunriseSource: input.sunriseSource ?? "manual-input",
    birthOrEventTime: input.birthOrEventTime.toISOString(),
    sunriseTime: input.sunriseTime.toISOString(),
    minutesElapsed: Number(minutesElapsed.toFixed(4)),
    rotationDegrees: Number(rotationDegrees.toFixed(4)),
    sunEclipticLongitude: Number(sunLongitude.toFixed(6)),
    rawAscendant: Number(rawAscendant.toFixed(6)),
    formattedAscendant: formatToZodiacString(rawAscendant).displayString,
    sunHouse,
    houses,
  };
}

export function isDawnAscendantInputComplete(input: { sunriseTime?: Date; sunEclipticLongitude?: number }) {
  return input.sunriseTime instanceof Date && !Number.isNaN(input.sunriseTime.getTime()) && Number.isFinite(input.sunEclipticLongitude);
}
