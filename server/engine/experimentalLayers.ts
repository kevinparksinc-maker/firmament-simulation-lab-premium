import { DASHA_SEQUENCE, DASHA_YEARS, NAKSHATRAS, kpSubSubDetailsFromCanonicalLongitude, type PlanetReading, type Prediction } from "./firmamentEngine";

export const EXPERIMENTAL_LAYER_STATUS = "experimental-read-only" as const;
export const DEFAULT_HARMONICS = Object.freeze([
  { harmonic: 2, maxOrbDeg: 6, falloff: "gaussian" as const, enabled: true },
  { harmonic: 3, maxOrbDeg: 5, falloff: "gaussian" as const, enabled: true },
  { harmonic: 4, maxOrbDeg: 4, falloff: "gaussian" as const, enabled: true },
  { harmonic: 5, maxOrbDeg: 3.5, falloff: "gaussian" as const, enabled: true },
  { harmonic: 6, maxOrbDeg: 3, falloff: "gaussian" as const, enabled: true },
  { harmonic: 7, maxOrbDeg: 2.75, falloff: "gaussian" as const, enabled: true },
  { harmonic: 8, maxOrbDeg: 2.5, falloff: "gaussian" as const, enabled: true },
  { harmonic: 9, maxOrbDeg: 2.25, falloff: "gaussian" as const, enabled: true },
  { harmonic: 10, maxOrbDeg: 2, falloff: "gaussian" as const, enabled: true },
  { harmonic: 11, maxOrbDeg: 1.75, falloff: "gaussian" as const, enabled: true },
  { harmonic: 12, maxOrbDeg: 1.5, falloff: "gaussian" as const, enabled: true },
] as const);

export const DEFAULT_HARMONICS_V2 = Object.freeze([
  { harmonic: 2, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 3, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 4, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 5, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 6, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 7, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 8, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 9, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 10, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 11, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
  { harmonic: 12, maxOrbDeg: 5, falloff: "linear" as const, enabled: true },
] as const);

export type ExperimentalWinner = "A" | "B" | "TIE" | "NOT_EVALUABLE";
export type EvidenceItem = { label: string; value: string; side?: "A" | "B" | "SHARED" };
export type ExperimentalLayerVerdict = {
  layer: "harmonics" | "varga" | "ashtakavarga" | "dasha";
  method: string;
  scoreA: number;
  scoreB: number;
  winner: ExperimentalWinner;
  confidence: number;
  rationale: string[];
  evidence: EvidenceItem[];
  status: typeof EXPERIMENTAL_LAYER_STATUS;
};

export type HouseFamilyConfig = { sideA: number[]; sideB: number[] };
export const DEFAULT_HOUSE_FAMILIES: HouseFamilyConfig = Object.freeze({
  sideA: [1, 2, 3, 6, 10, 11],
  sideB: [4, 5, 7, 8, 9, 12],
});

const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] as const;
const SIGN_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"] as const;
const VARGA_METHODS = {
  3: "PARASHARI",
  9: "PARASHARI_NAVAMSA",
  10: "PARASHARI_DASAMSA",
  27: "TRADITIONAL_ELEMENTAL_BASELINE",
  30: "PARASHARI_TRIMSAMSA",
} as const;

type Side = "A" | "B" | "NEUTRAL";
function normalize(value: number) { return ((value % 360) + 360) % 360; }
function round(value: number, digits = 4) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }
function circularDistance(a: number, b: number) { const delta = Math.abs(normalize(a - b)); return Math.min(delta, 360 - delta); }
function winnerFor(scoreA: number, scoreB: number): ExperimentalWinner {
  if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) return "NOT_EVALUABLE";
  if (Math.abs(scoreA - scoreB) < 1e-9) return "TIE";
  return scoreA > scoreB ? "A" : "B";
}
function sideForHouse(house: number, families: HouseFamilyConfig): Side {
  if (families.sideA.includes(house)) return "A";
  if (families.sideB.includes(house)) return "B";
  return "NEUTRAL";
}
function confidence(scoreA: number, scoreB: number) { return round(Math.min(1, Math.abs(scoreA - scoreB) / Math.max(1, Math.abs(scoreA) + Math.abs(scoreB))), 3); }

export type HarmonicConfig = { harmonic: number; maxOrbDeg: number; falloff: "linear" | "gaussian"; enabled: boolean };
export type HarmonicPair = { planetA: string; planetB: string; delta: number; targetAngle: number; residual: number; resonance: number; transformedLongitudeA?: number; transformedLongitudeB?: number };
export type HarmonicFamilyResult = {
  harmonic: number;
  pairs: HarmonicPair[];
  internalA: number;
  internalB: number;
  crossFamily: number;
  ACoherence: number;
  BCoherence: number;
  dominantFamily: "A" | "B" | "NEUTRAL";
};

function harmonicResonance(delta: number, harmonic: number, orb: number, falloff: HarmonicConfig["falloff"]) {
  const step = 360 / harmonic;
  let residual = Infinity;
  for (let k = 0; k < harmonic; k += 1) residual = Math.min(residual, circularDistance(delta, k * step));
  if (residual > orb) return { residual, resonance: 0 };
  const resonance = falloff === "linear" ? Math.max(0, 1 - residual / orb) : Math.exp(-((residual / orb) ** 2));
  return { residual, resonance };
}

export function calculateHarmonic(planets: PlanetReading[], config: HarmonicConfig, families = DEFAULT_HOUSE_FAMILIES): HarmonicFamilyResult {
  const pairs: HarmonicPair[] = [];
  let internalA = 0; let internalB = 0; let crossFamily = 0; let countA = 0; let countB = 0; let crossCount = 0;
  for (let i = 0; i < planets.length; i += 1) for (let j = i + 1; j < planets.length; j += 1) {
    const left = planets[i]!; const right = planets[j]!;
    const leftSide = sideForHouse(left.house, families); const rightSide = sideForHouse(right.house, families);
    const measured = harmonicResonance(circularDistance(left.backgroundWheelLongitude, right.backgroundWheelLongitude), config.harmonic, config.maxOrbDeg, config.falloff);
    const targetAngle = Math.round(circularDistance(left.backgroundWheelLongitude, right.backgroundWheelLongitude) / (360 / config.harmonic)) * (360 / config.harmonic);
    pairs.push({ planetA: left.planet, planetB: right.planet, delta: round(circularDistance(left.backgroundWheelLongitude, right.backgroundWheelLongitude)), targetAngle: round(normalize(targetAngle)), residual: round(measured.residual), resonance: round(measured.resonance, 6) });
    if (leftSide === "A" && rightSide === "A") { internalA += measured.resonance; countA += 1; }
    else if (leftSide === "B" && rightSide === "B") { internalB += measured.resonance; countB += 1; }
    else if ((leftSide === "A" && rightSide === "B") || (leftSide === "B" && rightSide === "A")) { crossFamily += measured.resonance; crossCount += 1; }
  }
  const ACoherence = countA ? internalA / countA : 0;
  const BCoherence = countB ? internalB / countB : 0;
  return { harmonic: config.harmonic, pairs, internalA: round(internalA), internalB: round(internalB), crossFamily: round(crossFamily), ACoherence: round(ACoherence), BCoherence: round(BCoherence), dominantFamily: ACoherence === BCoherence ? "NEUTRAL" : ACoherence > BCoherence ? "A" : "B" };
}

export function calculateHarmonicSpectrum(prediction: Prediction, configs: readonly HarmonicConfig[] = DEFAULT_HARMONICS, families = DEFAULT_HOUSE_FAMILIES) {
  const results = configs.filter((config) => config.enabled).map((config) => calculateHarmonic(prediction.planets, config, families));
  const scoreA = results.reduce((sum, result) => sum + result.ACoherence, 0);
  const scoreB = results.reduce((sum, result) => sum + result.BCoherence, 0);
  const crossFamily = results.reduce((sum, result) => sum + result.crossFamily, 0);
  return {
    verdict: {
      layer: "harmonics", method: "H2-H12 harmonic family coherence", scoreA: round(scoreA), scoreB: round(scoreB), winner: winnerFor(scoreA, scoreB), confidence: confidence(scoreA, scoreB), status: EXPERIMENTAL_LAYER_STATUS,
      rationale: ["Planet pairs are tested against every k·(360/n) harmonic target with a configurable orb and falloff.", "Internal family coherence is directional only because house-family membership is directional; harmonic geometry itself remains symmetric.", "Cross-family resonance is retained as friction/coherence evidence and is not assigned to either side."],
      evidence: [{ label: "Enabled harmonics", value: results.map((result) => `H${result.harmonic}`).join(", "), side: "SHARED" }, { label: "Cross-family resonance", value: round(crossFamily).toFixed(4), side: "SHARED" }],
    } satisfies ExperimentalLayerVerdict,
    spectrum: results,
    config: configs,
    houseFamilies: families,
  };
}

export function universalLinearResonance(residual: number) {
  return residual > 5 ? 0 : Math.max(0, 1 - residual / 5);
}

function harmonicResonanceV2(leftLongitude: number, rightLongitude: number, harmonic: number) {
  const transformedLongitudeA = normalize(leftLongitude * harmonic);
  const transformedLongitudeB = normalize(rightLongitude * harmonic);
  const residual = circularDistance(transformedLongitudeA, transformedLongitudeB);
  return { transformedLongitudeA, transformedLongitudeB, residual, resonance: universalLinearResonance(residual) };
}

export function calculateHarmonicV2(planets: PlanetReading[], config: HarmonicConfig, families = DEFAULT_HOUSE_FAMILIES): HarmonicFamilyResult {
  const pairs: HarmonicPair[] = [];
  let internalA = 0; let internalB = 0; let crossFamily = 0; let countA = 0; let countB = 0;
  for (let i = 0; i < planets.length; i += 1) for (let j = i + 1; j < planets.length; j += 1) {
    const left = planets[i]!; const right = planets[j]!;
    const leftSide = sideForHouse(left.house, families); const rightSide = sideForHouse(right.house, families);
    const measured = harmonicResonanceV2(left.backgroundWheelLongitude, right.backgroundWheelLongitude, config.harmonic);
    pairs.push({ planetA: left.planet, planetB: right.planet, delta: round(circularDistance(left.backgroundWheelLongitude, right.backgroundWheelLongitude)), targetAngle: 0, residual: round(measured.residual), resonance: round(measured.resonance, 6), transformedLongitudeA: round(measured.transformedLongitudeA), transformedLongitudeB: round(measured.transformedLongitudeB) });
    if (leftSide === "A" && rightSide === "A") { internalA += measured.resonance; countA += 1; }
    else if (leftSide === "B" && rightSide === "B") { internalB += measured.resonance; countB += 1; }
    else if ((leftSide === "A" && rightSide === "B") || (leftSide === "B" && rightSide === "A")) crossFamily += measured.resonance;
  }
  const ACoherence = countA ? internalA / countA : 0;
  const BCoherence = countB ? internalB / countB : 0;
  return { harmonic: config.harmonic, pairs, internalA: round(internalA), internalB: round(internalB), crossFamily: round(crossFamily), ACoherence: round(ACoherence), BCoherence: round(BCoherence), dominantFamily: ACoherence === BCoherence ? "NEUTRAL" : ACoherence > BCoherence ? "A" : "B" };
}

export function calculateHarmonicSpectrumV2(prediction: Prediction, configs: readonly HarmonicConfig[] = DEFAULT_HARMONICS_V2, families = DEFAULT_HOUSE_FAMILIES) {
  const results = configs.filter((config) => config.enabled).map((config) => calculateHarmonicV2(prediction.planets, config, families));
  const scoreA = results.reduce((sum, result) => sum + result.ACoherence, 0);
  const scoreB = results.reduce((sum, result) => sum + result.BCoherence, 0);
  const crossFamily = results.reduce((sum, result) => sum + result.crossFamily, 0);
  return {
    verdict: {
      layer: "harmonics", method: "H2-H12 harmonic family coherence (universal 5-degree linear)", scoreA: round(scoreA), scoreB: round(scoreB), winner: winnerFor(scoreA, scoreB), confidence: confidence(scoreA, scoreB), status: EXPERIMENTAL_LAYER_STATUS,
      rationale: ["Harmonic longitudes are transformed as (longitude × harmonic) % 360.", "Every harmonic uses the same 5° maximum relationship boundary and linear resonance: 0° = 100%, 5° = 0%, >5° = inactive.", "This is a separately versioned calibration and does not replace the existing Gaussian V1 model."],
      evidence: [{ label: "Enabled harmonics", value: results.map((result) => `H${result.harmonic}`).join(", "), side: "SHARED" }, { label: "Cross-family resonance", value: round(crossFamily).toFixed(4), side: "SHARED" }],
    } satisfies ExperimentalLayerVerdict,
    spectrum: results,
    config: configs,
    houseFamilies: families,
    calculationVersion: "HARMONICS_V2",
  };
}

export type VargaPlacement = { planet: string; division: number; method: string; sourceLongitude: number; vargaSignIndex: number; vargaSign: string; degreeWithinVarga: number; house: number; lord: string; side: Side };
function signIndex(longitude: number) { return Math.floor(normalize(longitude) / 30); }
function vargaSignIndex(longitude: number, division: number) {
  const sourceSign = signIndex(longitude); const degree = normalize(longitude) % 30; const part = Math.min(division - 1, Math.floor((degree / 30) * division));
  if (division === 3) { const starts = sourceSign % 2 === 0 ? [sourceSign, (sourceSign + 4) % 12, (sourceSign + 8) % 12] : [(sourceSign + 8) % 12, (sourceSign + 4) % 12, sourceSign]; return starts[part]!; }
  if (division === 9) { const offset = sourceSign % 3 === 0 ? 0 : sourceSign % 3 === 1 ? 8 : 4; return (sourceSign + offset + part) % 12; }
  if (division === 10) return (sourceSign + (sourceSign % 2 === 0 ? 0 : 8) + part) % 12;
  if (division === 27) return (sourceSign * 3 + part) % 12;
  const odd = sourceSign % 2 === 0; const bounds = odd ? ["Mars", "Saturn", "Jupiter", "Mercury", "Venus"] : ["Venus", "Mercury", "Jupiter", "Saturn", "Mars"]; const starts = odd ? [0, 5, 8, 2, 1] : [1, 2, 8, 5, 0]; const widths = [5, 5, 8, 7, 5]; let cursor = 0; for (let i = 0; i < widths.length; i += 1) { cursor += widths[i]!; if (degree < cursor) return starts[i]!; } void bounds; return starts[4]!;
}
function placementFor(planet: PlanetReading, division: number, ascendantLongitude: number, families: HouseFamilyConfig): VargaPlacement {
  const index = vargaSignIndex(planet.backgroundWheelLongitude, division); const within = (normalize(planet.backgroundWheelLongitude) % 30) * division % 30; const ascIndex = vargaSignIndex(ascendantLongitude, division); const house = ((index - ascIndex + 12) % 12) + 1;
  return { planet: planet.planet, division, method: VARGA_METHODS[division as keyof typeof VARGA_METHODS], sourceLongitude: round(planet.backgroundWheelLongitude), vargaSignIndex: index, vargaSign: SIGN_NAMES[index]!, degreeWithinVarga: round(within), house, lord: SIGN_LORDS[index]!, side: sideForHouse(house, families) };
}

export function calculateVargaLayer(prediction: Prediction, divisions: readonly (3 | 9 | 10 | 27 | 30)[] = [3, 9, 10, 27, 30], families = DEFAULT_HOUSE_FAMILIES) {
  const placements = divisions.flatMap((division) => prediction.planets.map((planet) => placementFor(planet, division, prediction.ascendantLongitude, families)));
  const roleWeights: Record<number, number> = { 3: 1.2, 9: 0.8, 10: 1.1, 27: 1, 30: 0.8 };
  let scoreA = 0; let scoreB = 0;
  for (const placement of placements) { const weight = roleWeights[placement.division] ?? 1; if (placement.side === "A") scoreA += weight; if (placement.side === "B") scoreB += weight; }
  return {
    verdict: { layer: "varga", method: "D3/D9/D10/D27/D30 structural placements", scoreA: round(scoreA), scoreB: round(scoreB), winner: winnerFor(scoreA, scoreB), confidence: confidence(scoreA, scoreB), status: EXPERIMENTAL_LAYER_STATUS, rationale: ["Each divisional convention is explicit and records its method name; no Varga is treated as an inherent winner chart.", "Placements are mapped through the requested A/B house families after divisional sign transformation.", "Scores are inspection-only and do not alter the existing Territorial/KP synthesis."], evidence: divisions.map((division) => ({ label: `D${division}`, value: placements.filter((placement) => placement.division === division).map((placement) => `${placement.planet} ${placement.vargaSign} H${placement.house}`).join("; "), side: "SHARED" as const })) } satisfies ExperimentalLayerVerdict,
    placements, divisions, houseFamilies: families,
  };
}

/**
 * Classical Parashari Bhinnashtakavarga contribution tables.
 *
 * For each target planet, each of the eight reference points (Sun..Saturn
 * plus Lagna) contributes a bindu when the target sign is the listed number
 * of signs from that reference. Rahu/Ketu are deliberately excluded.
 *
 * The fixed row checksums are Sun 48, Moon 49, Mars 39, Mercury 54,
 * Jupiter 56, Venus 52 and Saturn 39. These checksums are useful regression
 * tests because they do not depend on the chart being evaluated.
 */
const BAV_SUPPORT: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12], Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12], Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11], Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12], Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12], Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11], Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 4, 6, 8, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11], Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12], Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12], Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11],
  },
};

const ASHTAKAVARGA_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const ASHTAKAVARGA_REFERENCES = [...ASHTAKAVARGA_PLANETS, "Lagna"] as const;
const CLASSICAL_BAV_TOTALS: Record<(typeof ASHTAKAVARGA_PLANETS)[number], number> = {
  Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39,
};

function zodiacSignIndex(longitude: number) {
  return Math.floor(normalize(longitude) / 30);
}

export type AshtakavargaPlanet = {
  planet: string;
  bindus: number[];
  total: number;
  expectedTotal: number;
  sideA: number;
  sideB: number;
};

export type Sarvashtakavarga = {
  bindus: number[];
  total: number;
  average: number;
  houses: Array<{ house: number; sign: string; bindus: number; side: Side }>;
};

export function calculateAshtakavargaLayer(prediction: Prediction, families = DEFAULT_HOUSE_FAMILIES) {
  const byPlanet = new Map(prediction.planets.map((planet) => [planet.planet, planet]));
  const referenceSign = (reference: string) => reference === "Lagna"
    ? zodiacSignIndex(prediction.ascendantLongitude)
    : zodiacSignIndex(byPlanet.get(reference)?.backgroundWheelLongitude ?? NaN);
  const ascendantSign = zodiacSignIndex(prediction.ascendantLongitude);
  const rows: AshtakavargaPlanet[] = [];

  for (const targetName of ASHTAKAVARGA_PLANETS) {
    const target = byPlanet.get(targetName);
    if (!target) continue;
    const support = BAV_SUPPORT[targetName]!;
    const bindus = Array.from({ length: 12 }, (_, signIndex) => ASHTAKAVARGA_REFERENCES.reduce((sum, reference) => {
      const sourceSign = referenceSign(reference);
      if (!Number.isFinite(sourceSign)) return sum;
      const relative = ((signIndex - sourceSign + 12) % 12) + 1;
      return sum + (support[reference]?.includes(relative) ? 1 : 0);
    }, 0));
    const total = bindus.reduce((sum, value) => sum + value, 0);
    const houseBindu = (house: number) => bindus[(ascendantSign + house - 1) % 12]!;
    const sideA = families.sideA.reduce((sum, house) => sum + houseBindu(house), 0);
    const sideB = families.sideB.reduce((sum, house) => sum + houseBindu(house), 0);
    rows.push({ planet: targetName, bindus, total, expectedTotal: CLASSICAL_BAV_TOTALS[targetName], sideA, sideB });
  }

  const savBindus = Array.from({ length: 12 }, (_, signIndex) => rows.reduce((sum, row) => sum + row.bindus[signIndex]!, 0));
  const savHouses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const signIndex = (ascendantSign + index) % 12;
    return { house, sign: SIGN_NAMES[signIndex]!, bindus: savBindus[signIndex]!, side: sideForHouse(house, families) };
  });
  const scoreA = families.sideA.length ? families.sideA.reduce((sum, house) => sum + savHouses[house - 1]!.bindus, 0) / families.sideA.length : 0;
  const scoreB = families.sideB.length ? families.sideB.reduce((sum, house) => sum + savHouses[house - 1]!.bindus, 0) / families.sideB.length : 0;
  const classicalChecks = rows.every((row) => row.total === row.expectedTotal);

  return {
    verdict: {
      layer: "ashtakavarga",
      method: "Classical Bhinnashtakavarga / Sarvashtakavarga (8 references, sign-based)",
      scoreA: round(scoreA), scoreB: round(scoreB), winner: winnerFor(scoreA, scoreB), confidence: confidence(scoreA, scoreB), status: EXPERIMENTAL_LAYER_STATUS,
      rationale: [
        "BAV is calculated by zodiac sign distance, not by the chart's local house numbers.",
        "Each target uses the seven classical grahas plus Lagna as the eight reference points; Rahu and Ketu are excluded.",
        classicalChecks ? "All seven BAV row totals match the classical checksum totals." : "A classical BAV checksum failed; inspect the longitude frame or contribution table before using the layer.",
        "A/B scores are an application-specific house-family projection of the classical SAV map, not a classical Ashtakavarga verdict.",
      ],
      evidence: [
        { label: "BAV totals", value: rows.map((row) => `${row.planet} ${row.total}/${row.expectedTotal}`).join(", "), side: "SHARED" },
        { label: "SAV total", value: String(savBindus.reduce((sum, value) => sum + value, 0)), side: "SHARED" },
        { label: "Family averages", value: `A ${round(scoreA)} / B ${round(scoreB)}`, side: scoreA === scoreB ? "SHARED" : scoreA > scoreB ? "A" : "B" },
      ],
    } satisfies ExperimentalLayerVerdict,
    rows,
    sarvashtakavarga: { bindus: savBindus, total: savBindus.reduce((sum, value) => sum + value, 0), average: round(savBindus.reduce((sum, value) => sum + value, 0) / 12, 3), houses: savHouses } satisfies Sarvashtakavarga,
    houseFamilies: families,
  };
}

export type DashaLord = (typeof DASHA_SEQUENCE)[number];
export type DashaPeriod = {
  lord: DashaLord;
  start: Date;
  end: Date;
  years: number;
  parentLord?: DashaLord;
  level: "mahadasha" | "antardasha" | "pratyantardasha";
};

export type VimshottariSnapshot = {
  nakshatra: string;
  nakshatraIndex: number;
  starLord: DashaLord;
  progressFraction: number;
  balanceYears: number;
  mahadasha: DashaPeriod;
  antardasha: DashaPeriod;
  pratyantardasha: DashaPeriod;
};

export type DashaNatalContext = { prediction: Prediction; birthTime: Date };

function addDashaYears(date: Date, years: number) {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function buildAntardashas(parent: DashaPeriod): DashaPeriod[] {
  const first = DASHA_SEQUENCE.indexOf(parent.lord);
  let cursor = parent.start;
  return DASHA_SEQUENCE.map((_, offset) => {
    const lord = DASHA_SEQUENCE[(first + offset) % DASHA_SEQUENCE.length]!;
    const years = parent.years * DASHA_YEARS[lord] / 120;
    const end = offset === DASHA_SEQUENCE.length - 1 ? parent.end : addDashaYears(cursor, years);
    const period = { lord, start: cursor, end, years, parentLord: parent.lord, level: "antardasha" as const };
    cursor = end;
    return period;
  });
}

function buildPratyantardashas(parent: DashaPeriod): DashaPeriod[] {
  const first = DASHA_SEQUENCE.indexOf(parent.lord);
  let cursor = parent.start;
  return DASHA_SEQUENCE.map((_, offset) => {
    const lord = DASHA_SEQUENCE[(first + offset) % DASHA_SEQUENCE.length]!;
    const years = parent.years * DASHA_YEARS[lord] / 120;
    const end = offset === DASHA_SEQUENCE.length - 1 ? parent.end : addDashaYears(cursor, years);
    const period = { lord, start: cursor, end, years, parentLord: parent.lord, level: "pratyantardasha" as const };
    cursor = end;
    return period;
  });
}

function contains(period: DashaPeriod, instant: Date) {
  return instant >= period.start && instant < period.end;
}

export function calculateVimshottariDasha(moonLongitude: number, birthTime: Date, atTime = birthTime): VimshottariSnapshot | null {
  if (!Number.isFinite(moonLongitude) || Number.isNaN(birthTime.getTime()) || Number.isNaN(atTime.getTime())) return null;
  if (atTime < birthTime) return null;
  const normalized = normalize(moonLongitude);
  const nakshatraArc = 360 / 27;
  const nakshatraIndex = Math.min(26, Math.floor(normalized / nakshatraArc));
  const within = normalized - nakshatraIndex * nakshatraArc;
  const progressFraction = within / nakshatraArc;
  const starLord = DASHA_SEQUENCE[nakshatraIndex % DASHA_SEQUENCE.length]!;
  const balanceYears = (1 - progressFraction) * DASHA_YEARS[starLord];

  const mahadashas: DashaPeriod[] = [];
  let cursor = new Date(birthTime);
  const firstEnd = addDashaYears(cursor, balanceYears);
  mahadashas.push({ lord: starLord, start: cursor, end: firstEnd, years: balanceYears, level: "mahadasha" });
  cursor = firstEnd;
  const firstIndex = DASHA_SEQUENCE.indexOf(starLord);
  for (let offset = 1; offset <= DASHA_SEQUENCE.length * 2; offset += 1) {
    const lord = DASHA_SEQUENCE[(firstIndex + offset) % DASHA_SEQUENCE.length]!;
    const years = DASHA_YEARS[lord];
    const end = addDashaYears(cursor, years);
    mahadashas.push({ lord, start: cursor, end, years, level: "mahadasha" });
    cursor = end;
    if (cursor > addDashaYears(atTime, DASHA_YEARS.Mercury + DASHA_YEARS.Saturn)) break;
  }

  const maha = mahadashas.find((period) => contains(period, atTime)) ?? mahadashas[mahadashas.length - 1]!;
  const antardashas = buildAntardashas(maha);
  const antara = antardashas.find((period) => contains(period, atTime)) ?? antardashas[antardashas.length - 1]!;
  const pratyantardashas = buildPratyantardashas(antara);
  const pratyantara = pratyantardashas.find((period) => contains(period, atTime)) ?? pratyantardashas[pratyantardashas.length - 1]!;
  return { nakshatra: NAKSHATRAS[nakshatraIndex]!, nakshatraIndex, starLord, progressFraction, balanceYears, mahadasha: maha, antardasha: antara, pratyantardasha: pratyantara };
}

export function calculateDashaLayer(prediction: Prediction, eventTime: Date, families = DEFAULT_HOUSE_FAMILIES, natal?: DashaNatalContext) {
  const natalPrediction = natal?.prediction ?? prediction;
  const natalBirthTime = natal?.birthTime ?? prediction.input.startTime;
  const natalMoon = natalPrediction.planets.find((planet) => planet.planet === "Moon");
  if (natalMoon && natal) {
    const snapshot = calculateVimshottariDasha(natalMoon.backgroundWheelLongitude, natalBirthTime, eventTime);
    if (!snapshot) return { verdict: { layer: "dasha", method: "Classical Vimshottari natal timeline", scoreA: 0, scoreB: 0, winner: "NOT_EVALUABLE", confidence: 0, status: EXPERIMENTAL_LAYER_STATUS, rationale: ["Natal Moon longitude and birth time are required."], evidence: [] } satisfies ExperimentalLayerVerdict, active: null, houseFamilies: families };
    const activeLords: Array<[DashaLord, number]> = [[snapshot.mahadasha.lord, 1], [snapshot.antardasha.lord, 0.7], [snapshot.pratyantardasha.lord, 0.4]];
    let scoreA = 0; let scoreB = 0;
    for (const [lord, weight] of activeLords) {
      const planet = prediction.planets.find((candidate) => candidate.planet === lord);
      const side = planet ? sideForHouse(planet.house, families) : "NEUTRAL";
      if (side === "A") scoreA += weight; else if (side === "B") scoreB += weight;
    }
    return {
      verdict: {
        layer: "dasha", method: "Classical Vimshottari natal timeline", scoreA: round(scoreA), scoreB: round(scoreB), winner: winnerFor(scoreA, scoreB), confidence: confidence(scoreA, scoreB), status: EXPERIMENTAL_LAYER_STATUS,
        rationale: ["The birth Moon selects the starting Nakshatra lord and the remaining balance is proportional to the Moon's untraversed Nakshatra arc.", "Mahadasha, Antardasha, and Pratyantardasha are subdivided using the fixed 120-year Vimshottari proportions.", "A/B scoring is an application-specific overlay: the active Dasha lords are mapped to the event chart's house families."],
        evidence: [
          { label: "Birth Nakshatra", value: `${snapshot.nakshatra} · ${snapshot.starLord}`, side: "SHARED" },
          { label: "Active chain", value: `${snapshot.mahadasha.lord} → ${snapshot.antardasha.lord} → ${snapshot.pratyantardasha.lord}`, side: "SHARED" },
          { label: "Mahadasha ends", value: snapshot.mahadasha.end.toISOString(), side: "SHARED" },
        ],
      } satisfies ExperimentalLayerVerdict,
      active: snapshot,
      houseFamilies: families,
    };
  }

  const moon = prediction.planets.find((planet) => planet.planet === "Moon");
  if (!moon) return { verdict: { layer: "dasha", method: "Event-time Nakshatra chain (fallback)", scoreA: 0, scoreB: 0, winner: "NOT_EVALUABLE", confidence: 0, status: EXPERIMENTAL_LAYER_STATUS, rationale: ["Moon longitude is required to resolve the event-time Nakshatra chain."], evidence: [] } satisfies ExperimentalLayerVerdict, active: null, houseFamilies: families };
  const chain = kpSubSubDetailsFromCanonicalLongitude(moon.backgroundWheelLongitude, eventTime, false);
  const activeLords: Array<[string, number]> = [[chain.starLord, 1], [chain.subLord, 0.7], [chain.subSubLord, 0.4]];
  let scoreA = 0; let scoreB = 0;
  for (const [lord, weight] of activeLords) {
    const planet = prediction.planets.find((candidate) => candidate.planet === lord);
    const side = planet ? sideForHouse(planet.house, families) : "NEUTRAL";
    if (side === "A") scoreA += weight; else if (side === "B") scoreB += weight;
  }
  return { verdict: { layer: "dasha", method: "Event-time Nakshatra/Sub/Sub-Sub chain", scoreA: round(scoreA), scoreB: round(scoreB), winner: winnerFor(scoreA, scoreB), confidence: confidence(scoreA, scoreB), status: EXPERIMENTAL_LAYER_STATUS, rationale: ["No natal birth epoch was supplied, so a natal Vimshottari timeline is not claimed.", "The fallback reports the event Moon's Nakshatra lord and proportional Sub/Sub-Sub subdivisions using the existing KP implementation."], evidence: [{ label: "Active chain", value: `${chain.starLord} → ${chain.subLord} → ${chain.subSubLord}`, side: "SHARED" }] } satisfies ExperimentalLayerVerdict, active: { ...chain, moonHouse: moon.house, moonNakshatra: moon.nakshatra }, houseFamilies: families };
}

export type CrossLayerAnalysis = {
  structural: ExperimentalWinner;
  relational: ExperimentalWinner;
  temporal: ExperimentalWinner;
  agreementCount: number;
  disagreement: boolean;
  rationale: string[];
};

export function analyzeExperimentalLayers(verdicts: readonly ExperimentalLayerVerdict[]): CrossLayerAnalysis {
  const find = (layer: ExperimentalLayerVerdict["layer"]) => verdicts.find((verdict) => verdict.layer === layer)?.winner ?? "NOT_EVALUABLE" as const;
  const structural = find("varga");
  const relational = find("harmonics");
  const temporal = find("dasha");
  const active = [structural, relational, temporal].filter((winner) => winner === "A" || winner === "B");
  const agreementCount = active.length ? Math.max(active.filter((winner) => winner === "A").length, active.filter((winner) => winner === "B").length) : 0;
  const disagreement = new Set(active).size > 1;
  return { structural, relational, temporal, agreementCount, disagreement, rationale: ["Structural testimony is represented by Varga; relational testimony by harmonic family coherence; temporal testimony uses classical natal Vimshottari when natal context is supplied, otherwise the event-time Nakshatra chain is retained as a clearly labeled fallback.", "Ashtakavarga remains quantified positional support and is intentionally not collapsed into one of the three testimony labels.", disagreement ? "Layer disagreement is preserved for research inspection; no production winner is overwritten." : "No A/B disagreement was detected among evaluable testimony layers."] };
}

export function calculateExperimentalLayers(prediction: Prediction, eventTime: Date, families = DEFAULT_HOUSE_FAMILIES, natal?: DashaNatalContext) {
  const harmonics = calculateHarmonicSpectrum(prediction, DEFAULT_HARMONICS, families);
  const varga = calculateVargaLayer(prediction, undefined, families);
  const ashtakavarga = calculateAshtakavargaLayer(prediction, families);
  const dasha = calculateDashaLayer(prediction, eventTime, families, natal);
  const verdicts = [harmonics.verdict, varga.verdict, ashtakavarga.verdict, dasha.verdict] as const;
  return { status: EXPERIMENTAL_LAYER_STATUS, houseFamilies: families, verdicts, crossLayer: analyzeExperimentalLayers(verdicts), harmonics, varga, ashtakavarga, dasha };
}
