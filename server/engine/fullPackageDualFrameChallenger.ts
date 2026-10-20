import {
  fixedEclipticHouseFromLongitude,
  generateFixedJ2000KPPrediction,
  generatePredictionForModel,
  runAgentGodFullLayerExperiment,
  type GameInput,
  type ManzilReading,
  type PlanetReading,
} from "./firmamentEngine";
import { calculateRestoredTerritorial, type CalculationTrace, type TerritorialPlanet } from "./territorialStack";
import { calculateDawnAnchoredAscendant, DAWN_ASCENDANT_MODEL } from "./dawnAnchoredAscendant";

type Side = "A" | "B" | "neutral";
type Winner = "A" | "B" | "TIE";
type FrameName = "God View" | "Agent’s View";
/**
 * SHARED — describes overall chart/environment; cannot move the A-vs-B differential by itself
 * (must contribute 0/0, never an identical non-zero amount to both sides).
 * SIDE_SPECIFIC — favors or penalizes one side based on that side's own placement.
 * ROLE_MODIFIER — applies because of a defined role (querent/player vs opponent), not the raw condition.
 * OUTCOME — a comparative technique evaluated across both sides at once (translation, KP fit, net aspect pattern).
 */
export type RuleClass = "SHARED" | "SIDE_SPECIFIC" | "ROLE_MODIFIER" | "OUTCOME";

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] as const;
const SIGN_RULERS: Record<(typeof SIGNS)[number], string> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun", Virgo: "Mercury",
  Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};
const ASCENDANT_HOUSES = new Set([1, 2, 3, 6, 10, 11]);
const DESCENDANT_HOUSES = new Set([4, 5, 7, 8, 9, 12]);
const MALEFICS = new Set(["Sun", "Mars", "Saturn", "Rahu", "Ketu"]);
const ARCHIVE_STARS = [
  { name: "Regulus", longitude: 135, nature: "benefic", group: "royal" },
  { name: "Aldebaran", longitude: 45, nature: "benefic", group: "royal" },
  { name: "Antares", longitude: 225, nature: "malefic", group: "royal" },
  { name: "Fomalhaut", longitude: 315, nature: "malefic", group: "royal" },
  { name: "Sirius", longitude: 104, nature: "benefic", group: "major" },
  { name: "Polaris", longitude: 0, nature: "benefic", group: "major" },
  { name: "Spica", longitude: 173.833, nature: "benefic", group: "major" },
  { name: "Arcturus", longitude: 164.183, nature: "benefic", group: "major" },
  { name: "Denebola", longitude: 182, nature: "malefic", group: "major" },
  { name: "Algol", longitude: 56.683, nature: "malefic", group: "minor" },
  { name: "Bellatrix", longitude: 162, nature: "malefic", group: "minor" },
] as const;

export const FULL_PACKAGE_ADDED_LAYERS = [
  "Fixed-star amplifications",
  "Retrograde condition",
  "Lunar flow",
  "Chart-wide aspects",
  "Moon phase / VOC",
  "Nodes (Rahu/Ketu)",
  "Upachaya growth",
  "Via Combusta",
  "Besiegement",
  "Mutual reception",
  "Translation of light",
  "Harmonious vs friction aspects",
  "KP Star → Sub → Sub–Sub chain",
] as const;

export type FullPackageLayerEvidence = {
  name: (typeof FULL_PACKAGE_ADDED_LAYERS)[number];
  scoreA: number;
  scoreB: number;
  ruleClass: RuleClass;
  detail: string;
  source: "recovered-archive-master" | "recovered-archive-horary" | "current-full-kp";
  limitation?: string;
  calculation?: CalculationTrace;
};

export type FullPackageFoundationLayerEvidence = {
  name: string;
  scoreA: number;
  scoreB: number;
  ruleClass: RuleClass;
  detail: string;
  source: "current-seven-layer-territorial";
  calculation?: CalculationTrace;
};

export type FullPackageFrame = {
  name: FrameName;
  coordinateFrame: "fixed-zodiac-wheel" | "observer-local-ascendant-equal-house" | "fixed-earth-dawn-anchored";
  houseRule: "permanent-aries-zero-equal-house" | "local-moving-ascendant-equal-house";
  ascendantModel: "god-fixed" | "astronomical-local-horizon" | "fixed-earth-dawn-anchored";
  sunriseSource?: string;
  sunriseTime?: string;
  ascendantLongitude: number;
  foundation: { scoreA: number; scoreB: number; layers: FullPackageFoundationLayerEvidence[] };
  foundationError?: string;
  addedLayers: FullPackageLayerEvidence[];
  synthesis: { scoreA: number; scoreB: number; margin: number; winner: Winner; noCall: boolean; formula: string };
};

export type FullPackageDualFrameChallenger = {
  status: "experimental-read-only";
  method: "sandbox-current-foundation-plus-recovered-extensions-v1";
  input: GameInput;
  recoveredArchiveLayers: readonly string[];
  god: FullPackageFrame;
  agent: FullPackageFrame;
  agreement: { state: "agree" | "split" | "no-call"; winner: Winner };
  parity: FrameParityDiagnostic;
  boundary: string;
};

export type FrameParityDiagnostic = {
  valid: boolean;
  methodParity: boolean;
  formulaParity: boolean;
  sourceParity: boolean;
  ruleClassParity: boolean;
  synthesisParity: boolean;
  reason: string;
  changedLayers: Array<{ name: string; godScoreA: number; godScoreB: number; agentScoreA: number; agentScoreB: number; differentialShift: number }>;
};

type FramePlanet = TerritorialPlanet & { longitude: number; backgroundWheelLongitude: number; fixedStarLongitude: number; manzil: ManzilReading };
type HouseLordEntry = { house: number; ruledSide: Exclude<Side, "neutral">; lord: string; placement: FramePlanet };

function calculation(formula: string, detail: string | string[]): CalculationTrace {
  const lines = Array.isArray(detail) ? detail : [detail];
  return { formula, inputs: lines, steps: lines };
}

export type AgentViewRotationMode = "none" | "ascendant-only" | "whole-chart";
export type AgentViewModel = "astronomical" | "fixed-earth-dawn-anchored";
export type DualFrameRunOptions = { agentViewRotation?: AgentViewRotationMode; agentViewModel?: AgentViewModel };

function normalize(value: number) { return ((value % 360) + 360) % 360; }
function round(value: number) { return Number(value.toFixed(2)); }
function angularDistance(first: number, second: number) { const diff = Math.abs(normalize(first) - normalize(second)); return diff > 180 ? 360 - diff : diff; }
function sideForHouse(house: number): Side { return ASCENDANT_HOUSES.has(house) ? "A" : DESCENDANT_HOUSES.has(house) ? "B" : "neutral"; }
function sideScore(side: Side, amount: number) { return side === "A" ? [amount, 0] as const : side === "B" ? [0, amount] as const : [0, 0] as const; }
function layerWinner(scoreA: number, scoreB: number): Winner { return scoreA === scoreB ? "TIE" : scoreA > scoreB ? "A" : "B"; }

function frameParity(god: FullPackageFrame, agent: FullPackageFrame): FrameParityDiagnostic {
  const godLayers = [...god.foundation.layers, ...god.addedLayers];
  const agentLayers = [...agent.foundation.layers, ...agent.addedLayers];
  const agentByName = new Map(agentLayers.map((layer) => [layer.name, layer]));
  const methodParity = godLayers.length === agentLayers.length && godLayers.every((layer, index) => layer.name === agentLayers[index]?.name);
  const formulaParity = methodParity && godLayers.every((layer) => layer.calculation?.formula === agentByName.get(layer.name)?.calculation?.formula);
  const sourceParity = methodParity && godLayers.every((layer) => layer.source === agentByName.get(layer.name)?.source);
  const ruleClassParity = methodParity && godLayers.every((layer) => layer.ruleClass === agentByName.get(layer.name)?.ruleClass);
  const synthesisParity = god.synthesis.formula === agent.synthesis.formula;
  const changedLayers = godLayers.flatMap((layer) => {
    const other = agentByName.get(layer.name);
    if (!other) return [];
    const godDifferential = layer.scoreA - layer.scoreB;
    const agentDifferential = other.scoreA - other.scoreB;
    const differentialShift = round(agentDifferential - godDifferential);
    return differentialShift === 0 ? [] : [{ name: layer.name, godScoreA: layer.scoreA, godScoreB: layer.scoreB, agentScoreA: other.scoreA, agentScoreB: other.scoreB, differentialShift }];
  });
  const valid = methodParity && formulaParity && sourceParity && ruleClassParity && synthesisParity && !god.foundationError && !agent.foundationError;
  return {
    valid,
    methodParity,
    formulaParity,
    sourceParity,
    ruleClassParity,
    synthesisParity,
    reason: valid ? "God View and Agent View use the same method roster, formulas, sources, rule classes, and synthesis rule; score differences are attributable to frame-dependent placement inputs." : "Parity contract failed: inspect method roster, formulas, sources, rule classes, synthesis rule, or foundation errors before trusting the split.",
    changedLayers,
  };
}
function signAt(longitude: number) { return SIGNS[Math.floor(normalize(longitude) / 30)]!; }
function aspectType(first: number, second: number) {
  const separation = angularDistance(first, second);
  if (separation <= 8) return "conjunction" as const;
  if (Math.abs(separation - 60) <= 6) return "sextile" as const;
  if (Math.abs(separation - 90) <= 8) return "square" as const;
  if (Math.abs(separation - 120) <= 8) return "trine" as const;
  if (Math.abs(separation - 180) <= 8) return "opposition" as const;
  return null;
}

function planetsForGod(input: GameInput): { ascendantLongitude: number; planets: FramePlanet[] } {
  const source = generateFixedJ2000KPPrediction(input);
  return {
    ascendantLongitude: 0,
    planets: source.planets.map((planet) => {
      // God View is a permanent Aries-zero house wheel applied to the real
      // of-date sky, not the frozen J2000 epoch — the wheel is fixed, the
      // planets still move. fixedJ2000EclipticLongitude is not used here.
      const backgroundWheelLongitude = planet.backgroundWheelLongitude;
      const position = fixedEclipticHouseFromLongitude(backgroundWheelLongitude);
      return {
        planet: planet.planet,
        longitude: backgroundWheelLongitude,
        backgroundWheelLongitude,
        tropicalLongitude: backgroundWheelLongitude,
        house: position.house,
        sign: position.sign,
        degreeInHouse: position.degreeInHouse,
        degreeInSign: position.degreeInHouse,
        altitude: planet.altitude,
        isRetrograde: planet.isRetrograde,
        nakshatra: planet.nakshatra,
        manzil: planet.manzil,
        // Fixed-star, mansion, and decan overlays all read the same absolute
        // 360-degree background wheel. House perspective never changes it.
        fixedStarLongitude: backgroundWheelLongitude,
      };
    }),
  };
}

function planetsForAgent(input: GameInput, rotationMode: AgentViewRotationMode = "none", agentViewModel: AgentViewModel = input.agentViewModel ?? "astronomical"): { ascendantLongitude: number; planets: FramePlanet[]; ascendantModel: "astronomical-local-horizon" | "fixed-earth-dawn-anchored"; sunriseSource?: string; sunriseTime?: string } {
  const source = generatePredictionForModel(input, "azimuth");
  const rotation = rotationMode === "none" ? 0 : 180;
  let ascendantLongitude = normalize(source.ascendantLongitude + rotation);
  let ascendantModel: "astronomical-local-horizon" | "fixed-earth-dawn-anchored" = "astronomical-local-horizon";
  let sunriseSource: string | undefined;
  let sunriseTime: string | undefined;
  if (agentViewModel === DAWN_ASCENDANT_MODEL) {
    if (!input.sunriseTime) throw new Error("Fixed-Earth Dawn-Anchored AgentView requires sunriseTime.");
    const sun = source.planets.find((planet) => planet.planet === "Sun");
    if (!sun) throw new Error("Fixed-Earth Dawn-Anchored AgentView requires the Sun longitude.");
    const dawn = calculateDawnAnchoredAscendant({ birthOrEventTime: input.startTime, sunriseTime: input.sunriseTime, sunEclipticLongitude: sun.ofDateEclipticLongitude, sunriseSource: input.sunriseSource });
    ascendantLongitude = normalize(dawn.rawAscendant + rotation);
    ascendantModel = "fixed-earth-dawn-anchored";
    sunriseSource = dawn.sunriseSource;
    sunriseTime = dawn.sunriseTime;
  }
  return {
    ascendantLongitude,
    planets: source.planets.map((planet) => {
      const backgroundWheelLongitude = planet.backgroundWheelLongitude;
      const houseLongitude = rotationMode === "whole-chart" ? normalize(backgroundWheelLongitude + rotation) : backgroundWheelLongitude;
      const local = fixedEclipticHouseFromLongitude(houseLongitude - ascendantLongitude);
      const sign = fixedEclipticHouseFromLongitude(backgroundWheelLongitude);
      return {
        planet: planet.planet,
        longitude: houseLongitude,
        backgroundWheelLongitude,
        tropicalLongitude: backgroundWheelLongitude,
        house: local.house,
        sign: sign.sign,
        degreeInHouse: local.degreeInHouse,
        degreeInSign: sign.degreeInHouse,
        altitude: planet.altitude,
        isRetrograde: planet.isRetrograde,
        nakshatra: planet.nakshatra,
        manzil: planet.manzil,
        // The overlay longitude is shared and unrotated even when AgentView
        // changes the exact ascendant-relative house assignment.
        fixedStarLongitude: backgroundWheelLongitude,
      };
    }),
    ascendantModel,
    sunriseSource,
    sunriseTime,
  };
}

function houseLords(planets: FramePlanet[], ascendantLongitude: number): HouseLordEntry[] {
  const byName = new Map(planets.map((planet) => [planet.planet, planet]));
  const entries: HouseLordEntry[] = [];
  for (let house = 1; house <= 12; house += 1) {
    const ruledSide = sideForHouse(house);
    if (ruledSide === "neutral") continue;
    const cuspSign = signAt(ascendantLongitude + (house - 1) * 30);
    const lord = SIGN_RULERS[cuspSign];
    const placement = byName.get(lord);
    if (placement) entries.push({ house, ruledSide, lord, placement });
  }
  return entries;
}

function fixedStarLayer(entries: HouseLordEntry[]): FullPackageLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const hits: string[] = [];
  for (const entry of entries) {
    const side = sideForHouse(entry.placement.house);
    if (side === "neutral") continue;
    for (const star of ARCHIVE_STARS) {
      if (angularDistance(entry.placement.fixedStarLongitude, star.longitude) > 1) continue;
      const score = star.group === "royal" ? (star.nature === "benefic" ? 2 : -2.5) : star.group === "major" ? (star.nature === "benefic" ? 1 : -1.5) : -0.75;
      const [a, b] = sideScore(side, score);
      scoreA += a;
      scoreB += b;
      hits.push(`H${entry.house} ${entry.lord} / ${star.name} ${score > 0 ? "+" : ""}${score}`);
    }
  }
  return { name: "Fixed-star amplifications", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: hits.length ? hits.join("; ") : "No recovered-archive fixed-star conjunctions within the stated 1° orb.", source: "recovered-archive-master", calculation: calculation("Σ star weight by house-lord side when angular distance ≤ 1°", hits.length ? hits : ["No star input met the 1° orb."]) };
}

const RETROGRADE_PENALTY = -1;

function retrogradeLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const planet of planets.filter((candidate) => candidate.isRetrograde)) {
    const side = sideForHouse(planet.house);
    const [a, b] = sideScore(side, RETROGRADE_PENALTY);
    scoreA += a;
    scoreB += b;
    if (side !== "neutral") details.push(`${planet.planet} H${planet.house}: ${RETROGRADE_PENALTY}`);
  }
  return { name: "Retrograde condition", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No retrograde planets occupied a scoring cluster.", source: "recovered-archive-horary", calculation: calculation("For each retrograde planet: score −1 to its house side", details.length ? details : ["No retrograde planet contributed."]) };
}

function lunarLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  const moon = planets.find((planet) => planet.planet === "Moon");
  if (!moon) return { name: "Lunar flow", scoreA: 0, scoreB: 0, ruleClass: "SIDE_SPECIFIC", detail: "Moon unavailable.", source: "recovered-archive-master" };
  const side = sideForHouse(moon.house);
  const score = [1, 4, 7, 10].includes(moon.house) ? 8 : 5;
  const [scoreA, scoreB] = sideScore(side, score);
  return { name: "Lunar flow", scoreA, scoreB, ruleClass: "SIDE_SPECIFIC", detail: side === "neutral" ? `Moon in neutral H${moon.house}.` : `Moon in ${side} H${moon.house}: +${score}.`, source: "recovered-archive-master", calculation: calculation("Moon house ∈ {1,4,7,10} ? +8 : +5; assign to Moon's house side", [`Moon longitude ${moon.longitude.toFixed(2)}°, house H${moon.house}, side ${side}`, `Selected weight = ${score}`]) };
}

function chartAspectLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  let net = 0;
  const details: string[] = [];
  const weights: Record<NonNullable<ReturnType<typeof aspectType>>, number> = { conjunction: 0, sextile: 1, square: -2, trine: 2, opposition: -2 };
  for (let left = 0; left < planets.length; left += 1) {
    for (let right = left + 1; right < planets.length; right += 1) {
      const kind = aspectType(planets[left]!.longitude, planets[right]!.longitude);
      if (!kind) continue;
      const score = weights[kind] * 0.5;
      net += score;
      if (score !== 0) details.push(`${planets[left]!.planet}-${planets[right]!.planet} ${kind}: ${score > 0 ? "+" : ""}${score}`);
    }
  }
  return { name: "Chart-wide aspects", scoreA: round(net / 2), scoreB: round(-net / 2), ruleClass: "OUTCOME", detail: details.length ? details.join("; ") : "No scored major aspects.", source: "recovered-archive-master", calculation: calculation("For every major aspect: aspect weight × 0.5; A = net ÷ 2, B = −net ÷ 2", details.length ? details : ["No scored major aspects." ]), limitation: "The archive halves separating aspects. Applying/separating is not present in the current event payload, so this sandbox conservatively applies that half-strength treatment." };
}

function moonPhaseLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  const sun = planets.find((planet) => planet.planet === "Sun");
  const moon = planets.find((planet) => planet.planet === "Moon");
  if (!sun || !moon) return { name: "Moon phase / VOC", scoreA: 0, scoreB: 0, ruleClass: "SHARED", detail: "Sun or Moon unavailable.", source: "recovered-archive-master" };
  const separation = normalize(moon.longitude - sun.longitude);
  const phase = separation < 30 || separation >= 330 ? "new" : Math.abs(separation - 180) <= 15 ? "full" : separation < 180 ? "waxing" : "waning";
  return {
    name: "Moon phase / VOC",
    scoreA: 0,
    scoreB: 0,
    ruleClass: "SHARED",
    detail: `${phase} Moon at ${round(separation)}° solar separation; void-of-course is not determinable from this event snapshot (future lunar applications and sign exit are required). Recorded as chart-environment context only — no known rule ties this phase to one side specifically, so it does not count toward the winner.`,
    source: "recovered-archive-master",
    calculation: calculation("Environment-only: phase is computed; VOC unconfirmed, scoreA = 0 and scoreB = 0", [`Sun longitude ${sun.longitude.toFixed(2)}°, Moon longitude ${moon.longitude.toFixed(2)}°`, `Separation = ${round(separation)}°, phase = ${phase}`, "VOC status = undetermined; chart-environment only → 0 / 0"]),
    limitation: "Phase geometry is calculated; VOC is intentionally undetermined until a prospective Moon-aspect-to-sign-exit calculation is implemented. No directional sports weighting is invented.",
  };
}

function nodesLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const node of planets.filter(p => p.planet === "Rahu" || p.planet === "Ketu")) {
    const side = sideForHouse(node.house);
    const base = [1, 4, 7, 10].includes(node.house) ? 2 : 1;
    // Both nodes are always opposite; equal positive scores cancel. Record
    // qualitative polarity explicitly; do not falsely report missing data.
    const contribution = node.planet === "Rahu" ? base : -base;
    const [a,b] = sideScore(side, contribution);
    scoreA += a; scoreB += b;
    details.push(`${node.planet} H${node.house} side ${side}: ${contribution >= 0 ? "+" : ""}${contribution} (Rahu intensification / Ketu subtraction)`);
  }
  return { name: "Nodes (Rahu/Ketu)", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "Lunar nodes unavailable.", source: "recovered-archive-master", calculation: calculation("Opposite-node polarity: Rahu + and Ketu − to their house sides; angular houses use magnitude 2, others 1", details.length ? details : ["No nodes in chart."]), limitation: "Directional Rahu/Ketu polarity is an experimental model choice, not established sports predictive validity." };
}

const UPACHAYA_HOUSES = new Set([3, 6, 10, 11]);

function upachayaLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const planet of planets.filter((candidate) => MALEFICS.has(candidate.planet) && UPACHAYA_HOUSES.has(candidate.house))) {
    const side = sideForHouse(planet.house);
    const [a, b] = sideScore(side, 1);
    scoreA += a;
    scoreB += b;
    if (side !== "neutral") details.push(`${planet.planet} H${planet.house}: +1 ${side}`);
  }
  return { name: "Upachaya growth", scoreA, scoreB, ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No malefic occupies an Upachaya house (3/6/10/11) in a scoring cluster.", source: "recovered-archive-master", calculation: calculation("For each malefic in H3/H6/H10/H11: +1 to its house side", details.length ? details : ["No qualifying malefic input."]) };
}

function viaCombustaLayer(entries: HouseLordEntry[]): FullPackageLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const entry of entries) {
    if (entry.placement.longitude < 195 || entry.placement.longitude >= 225) continue;
    const [a, b] = sideScore(entry.ruledSide, -3);
    scoreA += a;
    scoreB += b;
    details.push(`H${entry.house} ${entry.lord}: -3`);
  }
  return { name: "Via Combusta", scoreA, scoreB, ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No scoring house lord in 15° Libra–15° Scorpio.", source: "recovered-archive-master", calculation: calculation("For each scoring house lord in [195°,225°): −3 to its ruled side", details.length ? details : ["No house lord input in the Via Combusta interval."]) };
}

function besiegementLayer(entries: HouseLordEntry[], planets: FramePlanet[]): FullPackageLayerEvidence {
  const mars = planets.find(p => p.planet === "Mars");
  const saturn = planets.find(p => p.planet === "Saturn");
  if (!mars || !saturn) return { name: "Besiegement", scoreA: 0, scoreB: 0, ruleClass: "SIDE_SPECIFIC", detail: "Mars or Saturn unavailable.", source: "recovered-archive-master" };
  let scoreA = 0, scoreB = 0;
  const details: string[] = [];
  // Positional enclosure proxy: a significator must be between the malefics
  // on their smaller zodiac arc. This is not a full applying/separating test.
  const forward = normalize(saturn.longitude - mars.longitude);
  const arcStart = forward <= 180 ? mars.longitude : saturn.longitude;
  const arcSize = Math.min(forward, 360 - forward);
  for (const entry of entries) {
    if (entry.lord === "Mars" || entry.lord === "Saturn") continue;
    const offset = normalize(entry.placement.longitude - arcStart);
    if (!(offset > 0 && offset < arcSize) || arcSize > 60) continue;
    const leftOrb = Math.min(offset, arcSize - offset);
    const score = round(-Math.max(0.25, 1 - leftOrb / 30));
    const [a,b] = sideScore(entry.ruledSide, score);
    scoreA += a; scoreB += b;
    details.push(`H${entry.house} ${entry.lord} enclosed between Mars/Saturn over ${round(arcSize)}° arc: ${score} to ${entry.ruledSide}`);
  }
  return { name: "Besiegement", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No scoring house lord enclosed on a Mars–Saturn arc of 60° or less.", source: "recovered-archive-master", calculation: calculation("Geometric enclosure on shorter Mars/Saturn zodiac arc (≤60°), negative to enclosed lord's ruled house-side", details.length ? details : ["No eligible enclosure."]), limitation: "Geometrical preliminary proxy only; a traditional applying/separating besiegement verdict requires velocities and exact aspect perfection." };
}

function mutualReceptionLayer(entries: HouseLordEntry[], planets: FramePlanet[]): FullPackageLayerEvidence {
  let scoreA = 0, scoreB = 0;
  const details: string[] = [];
  const traditional = new Set(["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"]);
  const eligible = planets.filter(p => traditional.has(p.planet));
  for (let i = 0; i < eligible.length; i++) for (let j = i + 1; j < eligible.length; j++) {
    const left = eligible[i]!, right = eligible[j]!;
    if (SIGN_RULERS[left.sign as (typeof SIGNS)[number]] !== right.planet || SIGN_RULERS[right.sign as (typeof SIGNS)[number]] !== left.planet) continue;
    const leftSide = sideForHouse(left.house), rightSide = sideForHouse(right.house);
    const [la,lb] = sideScore(leftSide, 1);
    const [ra,rb] = sideScore(rightSide, 1);
    scoreA += la + ra; scoreB += lb + rb;
    details.push(`${left.planet} H${left.house} ↔ ${right.planet} H${right.house} reciprocal domicile: +1 to each occupied house-side (${leftSide}/${rightSide})`);
  }
  return { name: "Mutual reception", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No planetary reciprocal domicile receptions in this chart.", source: "recovered-archive-master", calculation: calculation("For each unique traditional-planet reciprocal domicile pair, +1 support to each planet's occupied house-side", details.length ? details : ["No reciprocal domicile exchange."]), limitation: "Uses domicile-only reception; other reception types and applying aspects are not inferred. Equal cross-side receptions can validly tie." };
}

function translationLayer(entries: HouseLordEntry[], planets: FramePlanet[]): FullPackageLayerEvidence {
  const sideA = entries.filter((entry) => entry.ruledSide === "A");
  const sideB = entries.filter((entry) => entry.ruledSide === "B");
  const lordNames = new Set(entries.map((entry) => entry.lord));
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const translator of planets.filter((planet) => !lordNames.has(planet.planet))) {
    const closest = (candidates: HouseLordEntry[]) => candidates.map((entry) => ({ entry, distance: angularDistance(translator.longitude, entry.placement.longitude) })).filter((candidate) => aspectType(translator.longitude, candidate.entry.placement.longitude)).sort((left, right) => left.distance - right.distance)[0];
    const closestA = closest(sideA);
    const closestB = closest(sideB);
    if (!closestA || !closestB) continue;
    if (closestA.distance < closestB.distance) { scoreA += 3; details.push(`${translator.planet} → A: +3`); }
    else { scoreB += 3; details.push(`${translator.planet} → B: +3`); }
  }
  return { name: "Translation of light", scoreA, scoreB, ruleClass: "OUTCOME", detail: details.length ? details.join("; ") : "No third planet connected to both clusters by a major aspect.", source: "recovered-archive-master", calculation: calculation("For each non-lord translator connected to both clusters: +3 to the closer cluster", details.length ? details : ["No translator passed both-cluster aspect tests."]), limitation: "The recovered archive called this a geometric approximation because exact separating/applying speed data was unavailable." };
}

function frictionLayer(planets: FramePlanet[]): FullPackageLayerEvidence {
  // Read every body in every scoring house. The angular relationship is
  // evaluated without assigning a fabricated advantage to cross-side aspects.
  // Same-side harmony supports that side; same-side friction weakens it.
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  const targets = [
    { angle: 0, label: "conjunction", weight: -1 },
    { angle: 60, label: "sextile", weight: 1 },
    { angle: 90, label: "square", weight: -1 },
    { angle: 120, label: "trine", weight: 1 },
    { angle: 180, label: "opposition", weight: -1 },
  ] as const;
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const left = planets[i]!, right = planets[j]!;
      const separation = angularDistance(left.longitude, right.longitude);
      const matched = targets.map(target => ({ ...target, orb: Math.abs(separation - target.angle) }))
        .filter(target => target.orb <= 5)
        .sort((a, b) => a.orb - b.orb)[0];
      if (!matched) continue;
      const strength = Math.max(0, 1 - matched.orb / 5);
      const contribution = round(matched.weight * strength);
      const leftSide = sideForHouse(left.house);
      const rightSide = sideForHouse(right.house);
      if (leftSide === rightSide && leftSide !== "neutral") {
        if (leftSide === "A") scoreA += contribution;
        else scoreB += contribution;
        details.push(`${left.planet} H${left.house} / ${right.planet} H${right.house} ${matched.label} (${matched.orb.toFixed(2)}° orb) side ${leftSide}: ${contribution >= 0 ? "+" : ""}${contribution}`);
      } else {
        details.push(`${left.planet} H${left.house} / ${right.planet} H${right.house} ${matched.label}: cross-side contact recorded without winner assignment`);
      }
    }
  }
  return { name: "Harmonious vs friction aspects", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No chart-wide aspects inside the fixed 5° orb.", source: "recovered-archive-master", calculation: calculation("All body pairs: within 5° of 0/60/90/120/180; same-side trine/sextile + and conjunction/square/opposition − with linear 5° decay; cross-side aspects descriptive only", details.length ? details : ["No qualifying aspects."]), limitation: "Exploratory directional rule; conjunction treated as friction by configuration. Method coefficients have not been calibrated against historical outcomes." };
}

function kpLayer(kp: { ascendant: { finalKPWinFit: number }; descendant: { finalKPWinFit: number } }): FullPackageLayerEvidence {
  return { name: "KP Star → Sub → Sub–Sub chain", scoreA: round(kp.ascendant.finalKPWinFit), scoreB: round(kp.descendant.finalKPWinFit), ruleClass: "OUTCOME", detail: "Current complete KP family/resonance audit contributes its unmodified A/B final win-fit values to the sandbox synthesis.", source: "current-full-kp", calculation: calculation("Final KP win-fit = family score + sub-lord score + sub-sub-lord adjustment + resonance modifiers", [`Ascendant final win-fit = ${kp.ascendant.finalKPWinFit.toFixed(2)}`, `Descendant final win-fit = ${kp.descendant.finalKPWinFit.toFixed(2)}`]) };
}

function buildFrame(
  name: FrameName,
  input: GameInput,
  raw: { ascendantLongitude: number; planets: FramePlanet[]; ascendantModel?: "god-fixed" | "astronomical-local-horizon" | "fixed-earth-dawn-anchored"; sunriseSource?: string; sunriseTime?: string },
  kp: { ascendant: { finalKPWinFit: number }; descendant: { finalKPWinFit: number } },
): FullPackageFrame {
  const mode = name === "God View" ? "god" : "agent";
  let foundation: ReturnType<typeof calculateRestoredTerritorial>;
  let foundationError: string | undefined;
  try {
    foundation = calculateRestoredTerritorial(raw.planets, raw.ascendantLongitude, (longitude) => fixedEclipticHouseFromLongitude(longitude - raw.ascendantLongitude).house, mode);
  } catch (error) {
    foundationError = error instanceof Error ? error.message : String(error);
    foundation = { scoreA: 0, scoreB: 0, evidence: { layers: [], houseLords: [], planetaryWars: [], arabicLots: [], ninePlanetInfluence: [], decans: [] } };
  }
  const entries = houseLords(raw.planets, raw.ascendantLongitude);
  const addedLayers = [
    fixedStarLayer(entries), retrogradeLayer(raw.planets), lunarLayer(raw.planets), chartAspectLayer(raw.planets), moonPhaseLayer(raw.planets), nodesLayer(raw.planets), upachayaLayer(raw.planets), viaCombustaLayer(entries), besiegementLayer(entries, raw.planets), mutualReceptionLayer(entries, raw.planets), translationLayer(entries, raw.planets), frictionLayer(raw.planets), kpLayer(kp),
  ];
  const scoreA = round(foundation.scoreA + addedLayers.filter((layer) => layer.ruleClass !== "SHARED").reduce((sum, layer) => sum + layer.scoreA, 0));
  const scoreB = round(foundation.scoreB + addedLayers.filter((layer) => layer.ruleClass !== "SHARED").reduce((sum, layer) => sum + layer.scoreB, 0));
  const margin = round(Math.abs(scoreA - scoreB));
  const winner = margin < 1.5 ? "TIE" : layerWinner(scoreA, scoreB);
  return {
    name,
    coordinateFrame: name === "God View" ? "fixed-zodiac-wheel" : raw.ascendantModel === "fixed-earth-dawn-anchored" ? "fixed-earth-dawn-anchored" : "observer-local-ascendant-equal-house",
    houseRule: name === "God View" ? "permanent-aries-zero-equal-house" : "local-moving-ascendant-equal-house",
    ascendantModel: name === "God View" ? "god-fixed" : raw.ascendantModel ?? "astronomical-local-horizon",
    sunriseSource: raw.sunriseSource,
    sunriseTime: raw.sunriseTime,
    ascendantLongitude: round(raw.ascendantLongitude),
    foundation: {
      scoreA: foundation.scoreA,
      scoreB: foundation.scoreB,
      // All seven Territorial foundation layers are placement-driven and differ by side by construction.
      layers: foundation.evidence.layers.map((layer) => ({ ...layer, source: "current-seven-layer-territorial" as const, ruleClass: "SIDE_SPECIFIC" as const })),
    },
    foundationError,
    addedLayers,
    synthesis: { scoreA, scoreB, margin, winner, noCall: winner === "TIE", formula: "Current seven-layer Territorial foundation + each recovered archive addition + current full KP win-fit; all coefficients are fixed at 1.0 and were not tuned to outcomes." },
  };
}

/**
 * Sandbox-only expansion. It deliberately keeps the permanent fixed-house and
 * moving-Ascendant frames separate and does not write validation rows or alter
 * a live prediction path. Its foundation is the current Territorial stack, not
 * a claimed byte-for-byte execution of the separately recovered master engine.
 */
export function runFullPackageDualFrameChallenger(input: GameInput, options: DualFrameRunOptions = {}): FullPackageDualFrameChallenger {
  const existing = runAgentGodFullLayerExperiment(input);
  const god = buildFrame("God View", input, planetsForGod(input), existing.god.kp);
  const rotationMode = options.agentViewRotation ?? "none";
  const agent = buildFrame("Agent’s View", input, planetsForAgent(input, rotationMode), existing.agent.kp);
  const agreement = god.synthesis.winner === "TIE" || agent.synthesis.winner === "TIE"
    ? { state: "no-call" as const, winner: "TIE" as const }
    : god.synthesis.winner === agent.synthesis.winner
      ? { state: "agree" as const, winner: god.synthesis.winner }
      : { state: "split" as const, winner: "TIE" as const };
  const parity = frameParity(god, agent);
  return {
    status: "experimental-read-only",
    method: "sandbox-current-foundation-plus-recovered-extensions-v1",
    input,
    recoveredArchiveLayers: FULL_PACKAGE_ADDED_LAYERS,
    god,
    agent,
    agreement,
    parity,
    boundary: `Sandbox-only current-foundation-plus-archive-extensions challenger (${rotationMode} AgentView rotation). It combines the current seven-layer Territorial foundation and full KP chain with recovered archive additions under each frame’s own house rule. The recovered master source uses a distinct canonical territorial foundation, so this is not an exact master-engine replay. No live winner, live weight, validation model version, frozen run, or outcome is changed. It is not claimed to be the missing Tyson–Douglas or 70–78% method.`,
  };
}

export type LayerDiagnostic = {
  name: string;
  ruleClass: RuleClass;
  scoreA: number;
  scoreB: number;
  /** scoreA - scoreB for this layer alone. Zero for every SHARED layer by construction. */
  differential: number;
  countedTowardWinner: boolean;
};

export type FrameDiagnostic = {
  frame: FrameName;
  sideAContribution: number;
  sideBContribution: number;
  differential: number;
  winner: Winner;
  /** Absolute margin between the two sides — how decisively this frame calls it, not a 0-1 probability. */
  confidence: number;
  foundationError?: string;
  /** Layers that actually moved the differential, sorted by how much they moved it. */
  rulesThatMovedTheWinner: LayerDiagnostic[];
  /** SHARED layers — recorded as evidence/flavor but mathematically inert on the winner. */
  rulesSharedAndCanceled: LayerDiagnostic[];
};

function diagnoseFrame(frame: FullPackageFrame): FrameDiagnostic {
  const allLayers: LayerDiagnostic[] = [
    ...frame.foundation.layers.map((layer) => ({
      name: layer.name,
      ruleClass: layer.ruleClass,
      scoreA: layer.scoreA,
      scoreB: layer.scoreB,
      differential: round(layer.scoreA - layer.scoreB),
      countedTowardWinner: layer.ruleClass !== "SHARED",
    })),
    ...frame.addedLayers.map((layer) => ({
      name: layer.name,
      ruleClass: layer.ruleClass,
      scoreA: layer.scoreA,
      scoreB: layer.scoreB,
      differential: round(layer.scoreA - layer.scoreB),
      countedTowardWinner: layer.ruleClass !== "SHARED",
    })),
  ];
  return {
    frame: frame.name,
    sideAContribution: frame.synthesis.scoreA,
    sideBContribution: frame.synthesis.scoreB,
    differential: round(frame.synthesis.scoreA - frame.synthesis.scoreB),
    winner: frame.synthesis.winner,
    confidence: frame.synthesis.margin,
    foundationError: frame.foundationError,
    rulesThatMovedTheWinner: allLayers
      .filter((layer) => layer.countedTowardWinner)
      .sort((left, right) => Math.abs(right.differential) - Math.abs(left.differential)),
    rulesSharedAndCanceled: allLayers.filter((layer) => !layer.countedTowardWinner),
  };
}

/**
 * Layer-by-layer audit trail for one game: Side A / Side B / differential per frame,
 * which individual rules actually moved that differential (ranked by impact), which
 * rules were SHARED and therefore mathematically inert, the final call, and the
 * margin as a confidence/strength figure. Does not alter any live prediction path.
 */
export function runFullPackageDiagnostic(input: GameInput): { god: FrameDiagnostic; agent: FrameDiagnostic; agreement: FullPackageDualFrameChallenger["agreement"] } {
  const result = runFullPackageDualFrameChallenger(input);
  return { god: diagnoseFrame(result.god), agent: diagnoseFrame(result.agent), agreement: result.agreement };
}
