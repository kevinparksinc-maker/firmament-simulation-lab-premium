# Firmament Simulation Lab — Exact Source Code Audit Bundle

Source snapshot: `main` on 2026-10-19, fetched by GitHub connector. The individual source files below are **verbatim**, separated by headers. There are **16 files**. This is an audit copy, **not executable** as one combined TypeScript module. Keep original files independent when reviewing. The outside reviewer must verify correctness, incomplete methods, and discrepancies rather than assume any documentation proves accuracy.

## FILE: server/engine/fullPackageDualFrameChallenger.ts

Git blob SHA: `94694d78579ff1e4b9cdd1ec7025cde0b2a3f247`

```typescript
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
import {completeChartLedger} from "./completeChartLedger";
import {buildFamilyAudit,attachFamilyAudit} from "./collectiveFamilyAudit";
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
  fullChartLedger: ReturnType<typeof completeChartLedger>;
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
  if (separation <= 5) return "conjunction" as const;
  if (Math.abs(separation - 60) <= 5) return "sextile" as const;
  if (Math.abs(separation - 90) <= 5) return "square" as const;
  if (Math.abs(separation - 120) <= 5) return "trine" as const;
  if (Math.abs(separation - 180) <= 5) return "opposition" as const;
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
  let scoreA = 0, scoreB = 0;
  const details: string[] = [];
  const weights: Record<NonNullable<ReturnType<typeof aspectType>>, number> = { conjunction: -1, sextile: 1, square: -2, trine: 2, opposition: -2 };
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const left = planets[i]!, right = planets[j]!;
      const kind = aspectType(left.longitude, right.longitude);
      if (!kind) continue;
      const contribution = weights[kind] * 0.5;
      const aSide = sideForHouse(left.house), bSide = sideForHouse(right.house);
      // Never direct an unassigned global aspect score to a team.
      // Shared cross-side contacts are real evidence for BOTH sides, not an invented advantage.
      if (aSide === bSide) {
        if (aSide === "A") scoreA += contribution;
        if (aSide === "B") scoreB += contribution;
      } else {
        if (aSide === "A" || bSide === "A") scoreA += contribution;
        if (aSide === "B" || bSide === "B") scoreB += contribution;
      }
      details.push(`${left.planet} H${left.house} (${aSide}) / ${right.planet} H${right.house} (${bSide}) ${kind}: ${contribution >= 0 ? "+" : ""}${contribution} per involved side`);
    }
  }
  return { name: "Chart-wide aspects", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No major aspects within the fixed 5° orb.", source: "recovered-archive-master", calculation: calculation("All planetary pairs within 5° of an approved major aspect: score the involved house side(s) directly; cross-side contacts apply symmetrically to both sides without fabricating a directional edge", details.length ? details : ["No qualifying aspects."]), limitation: "Cross-side contacts have symmetric impact until a user-approved directional doctrine specifies otherwise. Current coefficients remain experimental." };
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
  const sideA = entries.filter(entry => entry.ruledSide === "A");
  const sideB = entries.filter(entry => entry.ruledSide === "B");
  const lordNames = new Set(entries.map(entry => entry.lord));
  let scoreA = 0, scoreB = 0;
  const details: string[] = [];
  const traces: string[] = [];
  for (const translator of planets.filter(planet => !lordNames.has(planet.planet))) {
    const candidates = (family: HouseLordEntry[]) => family.map(entry => ({
      entry,
      separation: angularDistance(translator.longitude, entry.placement.longitude),
      aspect: aspectType(translator.longitude, entry.placement.longitude),
    })).filter(candidate => candidate.aspect).sort((left,right)=>left.separation-right.separation);
    const closestA = candidates(sideA)[0], closestB = candidates(sideB)[0];
    if (!closestA || !closestB) {
      traces.push(`${translator.planet} H${translator.house} at ${translator.longitude.toFixed(2)}°: no +3; missing qualifying aspect to ${!closestA ? "A" : ""}${!closestA && !closestB ? " and " : ""}${!closestB ? "B" : ""} family`);
      continue;
    }
    const describe=(v:typeof closestA,side:"A"|"B")=>`${side} H${v.entry.house} ruler ${v.entry.lord} H${v.entry.placement.house} at ${v.entry.placement.longitude.toFixed(2)}°; ${v.aspect}, separation ${v.separation.toFixed(2)}°`;
    const winner = closestA.separation < closestB.separation ? "A" : "B";
    if (winner==="A") scoreA+=3; else scoreB+=3;
    const line=`${translator.planet} H${translator.house} at ${translator.longitude.toFixed(2)}° → [${describe(closestA,"A")}] vs [${describe(closestB,"B")}]; smaller absolute separation → ${winner} +3 (running A=${scoreA}, B=${scoreB})`;
    details.push(line);traces.push(line);
  }
  return { name:"Translation of light", scoreA, scoreB, ruleClass:"OUTCOME", detail:details.length ? details.join("; ") : "No third planet connected to both clusters by a major aspect.", source:"recovered-archive-master", calculation:calculation("EXPERIMENTAL geometric proxy: for each non-house-lord body aspecting at least one lord of both families within 5°, compare closest absolute angular separations; award +3 to smaller separation (equal separations currently favor B). NOT traditional applying/separating translation of light.", traces.length?traces:["No eligible non-lord translator; A=0, B=0."]), limitation:"Geometric proxy only; traditional translation requires applying/separating and relative planetary speeds. Absolute angular separation is not orb proximity to exact aspect. Equal separation currently favors B; do not interpret as validated traditional doctrine." };
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
      const strength = Math.max(0, 1 - matched.orb / 5); // Existing continuous taper retained until user defines exact 100/80/60/40 band boundaries.
      const contribution = round(matched.weight * strength);
      const leftSide = sideForHouse(left.house);
      const rightSide = sideForHouse(right.house);
      if (leftSide === rightSide && leftSide !== "neutral") {
        if (leftSide === "A") scoreA += contribution;
        else scoreB += contribution;
        details.push(`${left.planet} H${left.house} / ${right.planet} H${right.house} ${matched.label} (${matched.orb.toFixed(2)}° orb) side ${leftSide}: ${contribution >= 0 ? "+" : ""}${contribution}`);
      } else {
        // Credit or debit BOTH affected sides; this is symmetrical until a defensible directional rule is specified.
        if (leftSide === "A" || rightSide === "A") scoreA += contribution;
        if (leftSide === "B" || rightSide === "B") scoreB += contribution;
        details.push(`${left.planet} H${left.house} / ${right.planet} H${right.house} ${matched.label} (${matched.orb.toFixed(2)}° orb): cross-side ${contribution >= 0 ? "+" : ""}${contribution} to EACH involved side`);
      }
    }
  }
  return { name: "Harmonious vs friction aspects", scoreA: round(scoreA), scoreB: round(scoreB), ruleClass: "SIDE_SPECIFIC", detail: details.length ? details.join("; ") : "No chart-wide aspects inside the fixed 5° orb.", source: "recovered-archive-master", calculation: calculation("All body pairs: within 5° of 0/60/90/120/180; same-side trine/sextile + and conjunction/square/opposition − with linear 5° decay; cross-side contacts score both involved sides symmetrically", details.length ? details : ["No qualifying aspects."]), limitation: "Exploratory directional rule; conjunction treated as friction by configuration. Method coefficients have not been calibrated against historical outcomes." };
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
    throw new Error(`Territorial foundation failed in ${name}: ${foundationError}`);
  }
  const familyAudit = buildFamilyAudit(raw.planets,raw.ascendantLongitude,mode);
  const entries = houseLords(raw.planets, raw.ascendantLongitude);
  const addedLayers = [
    fixedStarLayer(entries), retrogradeLayer(raw.planets), lunarLayer(raw.planets), chartAspectLayer(raw.planets), moonPhaseLayer(raw.planets), nodesLayer(raw.planets), upachayaLayer(raw.planets), viaCombustaLayer(entries), besiegementLayer(entries, raw.planets), mutualReceptionLayer(entries, raw.planets), translationLayer(entries, raw.planets), frictionLayer(raw.planets), kpLayer(kp),
  ];
  const auditedLayers = addedLayers.map(layer=>attachFamilyAudit(layer,familyAudit));
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
      layers: foundation.evidence.layers.map((layer) => ({ ...attachFamilyAudit(layer,familyAudit), source: "current-seven-layer-territorial" as const, ruleClass: "SIDE_SPECIFIC" as const })),
    },
    foundationError,
    fullChartLedger:completeChartLedger(raw.planets),
    addedLayers:auditedLayers,
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

```

## FILE: server/engine/territorialStack.ts

Git blob SHA: `881ad333deb2969d4392eb56c30a594b7eb043e2`

```typescript
export type TerritorialSide = "A" | "B" | "neutral";

export type CalculationTrace = {
  formula: string;
  inputs: string[];
  steps: string[];
};

export type TerritorialPlanet = {
  planet: string;
  tropicalLongitude: number;
  house: number;
  sign: string;
  degreeInHouse: number;
  degreeInSign?: number;
  altitude: number;
  isRetrograde: boolean;
  nakshatra: string;
  manzil?: { index: number; name: string; startLongitude: number; endLongitude: number };
};

export type TerritorialHouseLordEvidence = {
  house: number;
  side: "A" | "B";
  lord: string;
  placementHouse: number;
  placementSign: string;
  base: number;
  nakshatra: { name: string; score: number };
  dignity: { status: string; score: number };
  planetaryWar: number;
  total: number;
};

export type DecanEvidence = {
  planet: string;
  sign: string;
  degreeInSign: number;
  decan: 1 | 2 | 3;
  ruler: string;
  rulerHouse: number;
  targetSide: TerritorialSide;
  allegiance: "supports" | "opposes" | "neutral";
  faceDignity: number;
  score: number;
};

export type TerritorialEvidence = {
  layers: Array<{ name: string; scoreA: number; scoreB: number; detail: string; calculation?: CalculationTrace }>;
  houseLords: TerritorialHouseLordEvidence[];
  planetaryWars: Array<{ winner: string; loser: string; degreeDifference: number }>;
  arabicLots: Array<{ name: string; longitude: number; sign: string; house: number; side: TerritorialSide; score: number; meaning: string; source: string; work: string; formulaDay: string; formulaNight: string; reversal: string }>;
  ninePlanetInfluence: Array<{ planet: string; house: number; side: TerritorialSide; score: number }>;
  decans: DecanEvidence[];
};

export type RestoredTerritorialResult = {
  scoreA: number;
  scoreB: number;
  evidence: TerritorialEvidence;
};

const ASCENDANT_HOUSES = new Set([1, 2, 3, 6, 10, 11]);
const DESCENDANT_HOUSES = new Set([7, 8, 9, 12, 4, 5]);
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const HOUSE_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const SIGN_RULERS: Record<string, string> = { Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter" };
const EXALTATIONS: Record<string, string> = { Sun: "Aries", Moon: "Taurus", Mercury: "Virgo", Venus: "Pisces", Mars: "Capricorn", Jupiter: "Cancer", Saturn: "Libra" };
const DEBILITATIONS: Record<string, string> = { Sun: "Libra", Moon: "Scorpio", Mercury: "Pisces", Venus: "Virgo", Mars: "Cancer", Jupiter: "Capricorn", Saturn: "Aries" };
const WAR_PRIORITY: Record<string, number> = { Saturn: 5, Jupiter: 4, Rahu: 3.5, Ketu: 3.5, Mars: 3, Sun: 2, Venus: 2, Mercury: 2, Moon: 1.5 };
const CHALDEAN_DECANS: Record<string, [string, string, string]> = {
  Aries: ["Mars", "Sun", "Venus"], Taurus: ["Mercury", "Moon", "Saturn"], Gemini: ["Jupiter", "Mars", "Sun"], Cancer: ["Venus", "Mercury", "Moon"],
  Leo: ["Saturn", "Jupiter", "Mars"], Virgo: ["Sun", "Venus", "Mercury"], Libra: ["Moon", "Saturn", "Jupiter"], Scorpio: ["Mars", "Sun", "Venus"],
  Sagittarius: ["Mercury", "Moon", "Saturn"], Capricorn: ["Jupiter", "Mars", "Sun"], Aquarius: ["Venus", "Mercury", "Moon"], Pisces: ["Saturn", "Jupiter", "Mars"],
};

type Trait = "L" | "M" | "H" | "E";
type StellarProfile = [gana: "Deva" | "Manushya" | "Rakshasa", yoni: string, traits: [Trait, Trait, Trait, Trait]];

/** Compact transcription of the original 27 Nakshatra sports profiles. */
const STELLAR_PROFILES: Record<string, StellarProfile> = {
  Ashwini: ["Deva", "Horse", ["E", "H", "M", "M"]], Bharani: ["Manushya", "Elephant", ["H", "M", "M", "H"]], Krittika: ["Rakshasa", "Sheep", ["E", "M", "M", "M"]],
  Rohini: ["Manushya", "Serpent", ["L", "H", "H", "H"]], Mrigashira: ["Deva", "Serpent", ["H", "M", "M", "M"]], Ardra: ["Manushya", "Dog", ["H", "L", "L", "L"]],
  Punarvasu: ["Deva", "Cat", ["M", "H", "M", "M"]], Pushya: ["Deva", "Goat", ["L", "E", "H", "H"]], Ashlesha: ["Rakshasa", "Cat", ["M", "M", "L", "M"]],
  Magha: ["Rakshasa", "Rat", ["M", "H", "H", "H"]], "Purva Phalguni": ["Manushya", "Rat", ["M", "L", "L", "L"]], "Uttara Phalguni": ["Manushya", "Cow", ["L", "H", "H", "H"]],
  Hasta: ["Deva", "Buffalo", ["H", "H", "H", "M"]], Chitra: ["Rakshasa", "Tiger", ["H", "M", "L", "M"]], Swati: ["Deva", "Buffalo", ["M", "M", "M", "M"]],
  Vishakha: ["Rakshasa", "Tiger", ["H", "M", "M", "H"]], Anuradha: ["Deva", "Deer", ["L", "H", "E", "H"]], Jyeshtha: ["Rakshasa", "Deer", ["M", "E", "H", "H"]],
  Mula: ["Rakshasa", "Dog", ["H", "L", "L", "L"]], "Purva Ashadha": ["Manushya", "Monkey", ["E", "H", "M", "M"]], "Uttara Ashadha": ["Manushya", "Mongoose", ["L", "E", "H", "E"]],
  Shravana: ["Deva", "Monkey", ["M", "H", "H", "M"]], Dhanishta: ["Rakshasa", "Lion", ["H", "M", "M", "H"]], Shatabhisha: ["Rakshasa", "Horse", ["M", "M", "L", "M"]],
  "Purva Bhadrapada": ["Rakshasa", "Lion", ["H", "L", "L", "M"]], "Uttara Bhadrapada": ["Manushya", "Cow", ["L", "H", "H", "H"]], Revati: ["Deva", "Elephant", ["L", "M", "M", "M"]],
};

function normalize(value: number) { return ((value % 360) + 360) % 360; }
function signedDifference(a: number, b: number) { return ((a - b + 540) % 360) - 180; }
function round(value: number) { return Number(value.toFixed(2)); }
function sideForHouse(house: number): TerritorialSide { return ASCENDANT_HOUSES.has(house) ? "A" : DESCENDANT_HOUSES.has(house) ? "B" : "neutral"; }
function signForLongitude(longitude: number) { return SIGNS[Math.floor(normalize(longitude) / 30)]!; }

/**
 * God View has no real ascendant — houses are the fixed natural-zodiac sequence
 * (house 1 = Aries, house 2 = Taurus, ...), so `HOUSE_LORDS[house - 1]` is correct as-is.
 * Agent Mode has a real ascendant, so each equal-house cusp is calculated from
 * the exact ascendant degree and the sign containing that cusp supplies the lord.
 */
function lordForHouse(house: number, mode: "god" | "agent", ascendantLongitude: number): string {
  if (mode === "god") return HOUSE_LORDS[house - 1]!;
  const cuspLongitude = normalize(ascendantLongitude + (house - 1) * 30);
  const houseSign = signForLongitude(cuspLongitude);
  return SIGN_RULERS[houseSign]!;
}

/** Traditional Chaldean faces: 0°–<10°, 10°–<20°, and 20°–<30° in each of the 12 signs. */
export function getChaldeanDecan(sign: string, degreeInSign: number) {
  const decanIndex = Math.min(2, Math.max(0, Math.floor(degreeInSign / 10)));
  const rulers = CHALDEAN_DECANS[sign];
  if (!rulers) throw new Error(`Unknown decan mapping for sign: ${sign}`);
  return { decan: (decanIndex + 1) as 1 | 2 | 3, ruler: rulers[decanIndex]! };
}

function dignity(planet: string, sign: string) {
  if (EXALTATIONS[planet] === sign) return { status: "Exalted", score: 2 };
  if (DEBILITATIONS[planet] === sign) return { status: "Debilitated", score: -2 };
  if (SIGN_RULERS[sign] === planet) return { status: "Own Sign", score: 1 };
  return { status: "Neutral", score: 0 };
}

function nakshatraInfluence(name: string, dignityScore: number) {
  const profile = STELLAR_PROFILES[name];
  if (!profile) throw new Error(`Unknown nakshatra: ${name}`);
  const traitWeight: Record<Trait, number> = { E: 1.35, H: 1.18, M: 1, L: 0.82 };
  const base = profile[2].reduce((sum, trait) => sum + traitWeight[trait], 0) / 4;
  const ganaBonus = profile[0] === "Rakshasa" ? 0.25 : profile[0] === "Deva" ? 0.15 : 0.10;
  const yoniMultiplier = ["Lion", "Tiger", "Horse", "Elephant"].includes(profile[1]) ? 1.15 : 1;
  return round((((base + ganaBonus) * yoniMultiplier * (1 + dignityScore * 0.05)) - 1) * 5);
}

function detectWars(planets: TerritorialPlanet[]) {
  const wars: Array<{ winner: string; loser: string; degreeDifference: number }> = [];
  for (let index = 0; index < planets.length; index += 1) {
    for (let compared = index + 1; compared < planets.length; compared += 1) {
      const first = planets[index]!;
      const second = planets[compared]!;
      const degreeDifference = Math.abs(signedDifference(first.tropicalLongitude, second.tropicalLongitude));
      if (degreeDifference <= 3) {
        const firstPriority = WAR_PRIORITY[first.planet] ?? 1;
        const secondPriority = WAR_PRIORITY[second.planet] ?? 1;
        wars.push(firstPriority > secondPriority ? { winner: first.planet, loser: second.planet, degreeDifference: round(degreeDifference) } : { winner: second.planet, loser: first.planet, degreeDifference: round(degreeDifference) });
      }
    }
  }
  return wars;
}

type LotDefinition = { name: string; meaning: string; source: string; work: string; day: (asc: number, p: (name: string) => number, fortune: number, spirit: number) => number; night: (asc: number, p: (name: string) => number, fortune: number, spirit: number) => number; formulaDay: string; formulaNight: string; reversal: string };

function canonicalLots(planets: Map<string, TerritorialPlanet>, ascendant: number, night: boolean) {
  const longitude = (planet: string) => { const position=planets.get(planet); if (!position || !Number.isFinite(position.tropicalLongitude)) throw new Error(`Arabic Lot missing finite longitude for ${planet}`); return position.tropicalLongitude; };
  const sun = longitude("Sun"), moon = longitude("Moon"), mars = longitude("Mars"), venus = longitude("Venus"), jupiter = longitude("Jupiter"), saturn = longitude("Saturn");
  const direct = (a: number, b: number) => ascendant + a - b;
  const reverse = (a: number, b: number) => ascendant + b - a;
  const fortune = night ? reverse(moon, sun) : direct(moon, sun);
  const spirit = night ? reverse(sun, moon) : direct(sun, moon);
  const definitions: LotDefinition[] = [
    { name: "Lot of Fortune", meaning: "Material circumstances, body, resources, and what happens to the side.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: () => fortune, night: () => reverse(moon, sun), formulaDay: "Asc + Moon − Sun", formulaNight: "Asc + Sun − Moon", reversal: "Reverse the luminary arc at night." },
    { name: "Lot of Spirit", meaning: "Agency, intention, strategy, and what the side tries to do.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: () => spirit, night: () => reverse(sun, moon), formulaDay: "Asc + Sun − Moon", formulaNight: "Asc + Moon − Sun", reversal: "Reverse the luminary arc at night." },
    { name: "Lot of Eros", meaning: "Desire, cohesion, attraction, alliance, and union.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: (_a, _p, _f, s) => direct(venus, s), night: (_a, _p, _f, s) => reverse(venus, s), formulaDay: "Asc + Venus − Spirit", formulaNight: "Asc + Spirit − Venus", reversal: "Reverse Venus ↔ Spirit at night." },
    { name: "Lot of Victory", meaning: "Overcoming resistance, achievement, and competitive success.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: (_a, _p, _f, s) => direct(jupiter, s), night: (_a, _p, _f, s) => reverse(jupiter, s), formulaDay: "Asc + Jupiter − Spirit", formulaNight: "Asc + Spirit − Jupiter", reversal: "Reverse Jupiter ↔ Spirit at night." },
    { name: "Lot of Necessity", meaning: "Constraint, pressure, disputes, enemies, and social obligation.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: (_a, p, f) => direct(f, p("Mercury")), night: (_a, p, f) => reverse(f, p("Mercury")), formulaDay: "Asc + Fortune − Mercury", formulaNight: "Asc + Mercury − Fortune", reversal: "Reverse Fortune ↔ Mercury at night." },
    { name: "Lot of Courage", meaning: "Risk, initiative, competitive force, and willingness to confront opposition.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: (_a, _p, f) => direct(f, mars), night: (_a, _p, f) => reverse(f, mars), formulaDay: "Asc + Fortune − Mars", formulaNight: "Asc + Mars − Fortune", reversal: "Reverse Fortune ↔ Mars at night." },
    { name: "Lot of Nemesis", meaning: "Defeat, danger, punishment, reversal, and consequences.", source: "Paulus Alexandrinus", work: "Introduction, Hermetic Lots", day: (_a, _p, f) => direct(f, saturn), night: (_a, _p, f) => reverse(f, saturn), formulaDay: "Asc + Fortune − Saturn", formulaNight: "Asc + Saturn − Fortune", reversal: "Reverse Fortune ↔ Saturn at night; score is negative." },
    { name: "Lot of Basis", meaning: "Foundation, stability, survival, and support of the side.", source: "Vettius Valens", work: "Anthology, principal lots", day: (_a, _p, f, s) => direct(s, f), night: (_a, _p, f, s) => reverse(s, f), formulaDay: "Asc + Spirit − Fortune", formulaNight: "Asc + Fortune − Spirit", reversal: "Reverse Spirit ↔ Fortune at night." },
    { name: "Lot of Exaltation", meaning: "Elevation, honors, recognition, status, and public standing.", source: "Vettius Valens", work: "Hermetic/Exaltation lot tradition", day: (_a, _p) => direct(18, sun), night: (_a, _p) => direct(32, moon), formulaDay: "Asc + 18° Aries − Sun", formulaNight: "Asc + 2° Taurus − Moon", reversal: "Use the day fixed point 18° Aries or night fixed point 2° Taurus." },
    { name: "Lot of Action", meaning: "Work, execution, public activity, and what the side does.", source: "Rhetorius the Egyptian", work: "Lot of Activity / Work tradition", day: (_a, p) => direct(p("Mars"), p("Mercury")), night: (_a, p) => reverse(p("Mars"), p("Mercury")), formulaDay: "Asc + Mars − Mercury", formulaNight: "Asc + Mercury − Mars", reversal: "Reverse Mars ↔ Mercury at night." },
    { name: "Lot of Death", meaning: "Endings, loss, closure, and irreversible transition.", source: "Dorotheus of Sidon", work: "Carmen Astrologicum, Death lot", day: (_a, p) => p("Saturn") + (ascendant + 210) - p("Moon"), night: (_a, p) => p("Saturn") + (ascendant + 210) - p("Moon"), formulaDay: "Saturn + 8th-house cusp − Moon", formulaNight: "Saturn + 8th-house cusp − Moon", reversal: "No day/night reversal in the selected Dorothean variant." },
    { name: "Lot of Property", meaning: "Land, venue, physical assets, and territorial advantage.", source: "Olympiodorus", work: "Property Disposition lot", day: (_a, p) => direct(jupiter, p("Mercury")), night: (_a, p) => reverse(jupiter, p("Mercury")), formulaDay: "Asc + Jupiter − Mercury", formulaNight: "Asc + Mercury − Jupiter", reversal: "Reverse Jupiter ↔ Mercury at night." },
    { name: "Lot of Travel", meaning: "Movement, distance, relocation, and away conditions.", source: "Firmicus Maternus", work: "Mathesis, Travel lot", day: (_a, p) => direct(p("Mars"), p("Sun")), night: (_a, p) => reverse(p("Mars"), p("Sun")), formulaDay: "Asc + Mars − Sun", formulaNight: "Asc + Sun − Mars", reversal: "Reverse Mars ↔ Sun at night." },
    { name: "Lot of Fame", meaning: "Glory, public momentum, recognition, and favorable reception.", source: "Olympiodorus", work: "Fame / Glory lot", day: (_a, p) => direct(p("Venus"), jupiter), night: (_a, p) => reverse(p("Venus"), jupiter), formulaDay: "Asc + Venus − Jupiter", formulaNight: "Asc + Jupiter − Venus", reversal: "Reverse Venus ↔ Jupiter at night." },
    { name: "Lot of Enemies", meaning: "Open opponents, rivals, threats, and adversarial pressure.", source: "Ancients / Olympiodorus", work: "Enemies lot", day: (_a, p) => direct(p("Mars"), saturn), night: (_a, p) => reverse(p("Mars"), saturn), formulaDay: "Asc + Mars − Saturn", formulaNight: "Asc + Saturn − Mars", reversal: "Reverse Mars ↔ Saturn at night." },
    { name: "Lot of Success", meaning: "Completion, favorable issue, and realized result.", source: "Abu Ma'shar", work: "Great Introduction, success tradition", day: (_a, p, f) => direct(jupiter, f), night: (_a, p, f) => reverse(jupiter, f), formulaDay: "Asc + Jupiter − Fortune", formulaNight: "Asc + Fortune − Jupiter", reversal: "Reverse Jupiter ↔ Fortune at night." },
    { name: "Lot of Triumph", meaning: "Advantage, decisive momentum, and public victory display.", source: "Hermetic extension", work: "Recovered sports lot set", day: () => direct(venus, saturn), night: () => reverse(venus, saturn), formulaDay: "Asc + Venus − Saturn", formulaNight: "Asc + Saturn − Venus", reversal: "Reverse Venus ↔ Saturn at night." },
    { name: "Lot of Glory", meaning: "Visibility, honor, and durable public distinction.", source: "Hermetic extension", work: "Recovered sports lot set", day: () => direct(sun, saturn), night: () => reverse(sun, saturn), formulaDay: "Asc + Sun − Saturn", formulaNight: "Asc + Saturn − Sun", reversal: "Reverse Sun ↔ Saturn at night." },
  ];
  return definitions.map((definition) => ({ definition, rawLongitude: night ? definition.night(ascendant, longitude, fortune, spirit) : definition.day(ascendant, longitude, fortune, spirit) }));
}

/**
 * Exact additive restoration of the audited Territorial layers. Arabic Lots are
 * calculated once per side, not once per house lord, so their influence is never
 * accidentally multiplied fivefold.
 */
export function calculateRestoredTerritorial(
  planets: TerritorialPlanet[],
  ascendantLongitude: number,
  lotHouseFromLongitude: (longitude: number) => number,
  mode: "god" | "agent" = "god",
): RestoredTerritorialResult {
  const planetsByName = new Map(planets.map((planet) => [planet.planet, planet]));
  const wars = detectWars(planets);
  const warEffects = new Map<string, number>();
  wars.forEach((war) => { warEffects.set(war.winner, (warEffects.get(war.winner) ?? 0) + 1); warEffects.set(war.loser, (warEffects.get(war.loser) ?? 0) - 1); });
  const houseLords: TerritorialHouseLordEvidence[] = [];
  const components = { baseA: 0, baseB: 0, nakA: 0, nakB: 0, dignA: 0, dignB: 0, warA: 0, warB: 0 };

  for (let house = 1; house <= 12; house += 1) {
    const lord = lordForHouse(house, mode, ascendantLongitude);
    const side = sideForHouse(house);
    const placement = planetsByName.get(lord);
    if (!placement) throw new Error(`Territorial house ${house}: missing ruling planet ${lord}`);
    if (side === "neutral") throw new Error(`Territorial house ${house}: invalid side`);
    const placementSide = sideForHouse(placement.house);
    let base = 0;
    if (placementSide === side) { base += 1; if (placement.house === house) base += 1; }
    else if (placementSide !== "neutral") { base -= 1; if ([1, 4, 7, 10].includes(placement.house)) base -= 1; }
    const dignityResult = dignity(lord, placement.sign);
    const nakshatraScore = nakshatraInfluence(placement.nakshatra, dignityResult.score);
    const planetaryWar = warEffects.get(lord) ?? 0;
    const evidence = { house, side, lord, placementHouse: placement.house, placementSign: placement.sign, base, nakshatra: { name: placement.nakshatra, score: nakshatraScore }, dignity: dignityResult, planetaryWar, total: round(base + nakshatraScore + dignityResult.score + planetaryWar) };
    houseLords.push(evidence);
    if (side === "A") { components.baseA += base; components.nakA += nakshatraScore; components.dignA += dignityResult.score; components.warA += planetaryWar; }
    else { components.baseB += base; components.nakB += nakshatraScore; components.dignB += dignityResult.score; components.warB += planetaryWar; }
  }

  const sunAltitude = planetsByName.get("Sun")?.altitude;
  if (sunAltitude === undefined || !Number.isFinite(sunAltitude)) throw new Error("Arabic Lots require a finite Sun altitude to determine day/night sect");
  const night = sunAltitude < 0;
  const arabicLots = canonicalLots(planetsByName, ascendantLongitude, night).map(({ definition, rawLongitude }) => {
    const longitude = normalize(rawLongitude);
    const house = lotHouseFromLongitude(longitude);
    const side = sideForHouse(house);
    const magnitude = [1, 4, 7, 10].includes(house) ? 2 : 1;
    const score = side === "neutral" ? 0 : definition.name === "Lot of Nemesis" ? -magnitude : magnitude;
    return { name: definition.name, longitude: round(longitude), sign: signForLongitude(longitude), house, side, score, meaning: definition.meaning, source: definition.source, work: definition.work, formulaDay: definition.formulaDay, formulaNight: definition.formulaNight, reversal: definition.reversal };
  });
  const lotA = arabicLots.filter((lot) => lot.side === "A").reduce((sum, lot) => sum + lot.score, 0);
  const lotB = arabicLots.filter((lot) => lot.side === "B").reduce((sum, lot) => sum + lot.score, 0);
  const ninePlanetInfluence = planets.map((planet) => {
    const side = sideForHouse(planet.house);
    return { planet: planet.planet, house: planet.house, side, score: side === "neutral" ? 0 : (planet.planet === "Sun" || planet.planet === "Moon" ? 1.4 : 1) };
  });
  const influenceA = ninePlanetInfluence.filter((planet) => planet.side === "A").reduce((sum, planet) => sum + planet.score, 0);
  const influenceB = ninePlanetInfluence.filter((planet) => planet.side === "B").reduce((sum, planet) => sum + planet.score, 0);
  const decans = planets.map((planet) => {
    const targetSide = sideForHouse(planet.house);
    // Sign-relative degree is not equal-house degree: compute it from the zodiacal longitude.
    if (!Number.isFinite(planet.tropicalLongitude)) throw new Error(`Decan ${planet.planet}: missing finite zodiac longitude`);
    const degreeInSign = normalize(planet.tropicalLongitude) % 30;
    if (planet.sign !== signForLongitude(planet.tropicalLongitude)) throw new Error(`Decan ${planet.planet}: sign/longitude mismatch`);
    const decan = getChaldeanDecan(planet.sign, degreeInSign);
    const rulerPlacement = planetsByName.get(decan.ruler);
    if (!rulerPlacement) throw new Error(`Decan ${planet.planet}: missing ruler ${decan.ruler}`);
    const rulerHouse = rulerPlacement.house;
    const rulerSide = sideForHouse(rulerHouse);
    const allegiance: DecanEvidence["allegiance"] = targetSide === "neutral" || rulerSide === "neutral" ? "neutral" : targetSide === rulerSide ? "supports" : "opposes";
    const faceDignity = planet.planet === decan.ruler ? 1 : 0;
    const rulerInfluence = allegiance === "supports" ? 0.5 : allegiance === "opposes" ? -0.5 : 0;
    const score = targetSide === "neutral" ? 0 : round(faceDignity + rulerInfluence);
    return { planet: planet.planet, sign: planet.sign, degreeInSign: round(degreeInSign), decan: decan.decan, ruler: decan.ruler, rulerHouse, targetSide, allegiance, faceDignity, score };
  });
  const decanA = decans.filter((entry) => entry.targetSide === "A").reduce((sum, entry) => sum + entry.score, 0);
  const decanB = decans.filter((entry) => entry.targetSide === "B").reduce((sum, entry) => sum + entry.score, 0);
  // Research-only same-mansion clustering: use every planetary body and all
  // 28 manzil sectors. This does not attribute invented classical sports powers
  // to a station; it measures same-side co-location inside the 5° aspect limit.
  let mansionA = 0, mansionB = 0;
  const mansionPairs: string[] = [];
  for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) {
    const left = planets[i]!, right = planets[j]!;
    if (left.manzil?.index == null || right.manzil?.index == null || left.manzil.index !== right.manzil.index) continue;
    const leftSide = sideForHouse(left.house), rightSide = sideForHouse(right.house);
    const difference = Math.abs(normalize(left.tropicalLongitude) - normalize(right.tropicalLongitude));
    const separation = Math.min(difference, 360 - difference);
    if (separation > 5) continue;
    const strength = round(Math.max(0, 1 - separation / 5));
    if (leftSide === rightSide && leftSide !== "neutral") {
      if (leftSide === "A") mansionA += strength;
      else mansionB += strength;
      mansionPairs.push(`${left.planet}/${right.planet} ${left.manzil.name} H${left.house}/H${right.house}: ${strength} to ${leftSide}`);
    } else {
      mansionPairs.push(`${left.planet}/${right.planet} ${left.manzil.name}: cross-side resonance, no automatic winning side`);
    }
  }
  const scoreA = components.baseA + components.nakA + components.dignA + components.warA + lotA + mansionA + influenceA + decanA;
  const scoreB = components.baseB + components.nakB + components.dignB + components.warB + lotB + mansionB + influenceB + decanB;
  const layers = [
    { name: "Cluster territory & house-lord placement", scoreA: round(components.baseA), scoreB: round(components.baseB), detail: "Own-cluster support and opponent-cluster displacement, including angular displacement penalties.", calculation: { formula: "Σ house-lord base points by ruled side", inputs: houseLords.map((entry) => `H${entry.house} ${entry.lord} placed H${entry.placementHouse}: base ${entry.base}`), steps: houseLords.map((entry) => `H${entry.house} (${entry.side}) → ${entry.base >= 0 ? "+" : ""}${entry.base} base`) } },
    { name: "Nakshatra influence", scoreA: round(components.nakA), scoreB: round(components.nakB), detail: "27-profile stellar influence using traits, Gana, Yoni, and dignity-linked lord synergy.", calculation: { formula: "round((((average trait weight + Gana bonus) × Yoni multiplier × (1 + dignity × 0.05)) − 1) × 5)", inputs: houseLords.map((entry) => `H${entry.house} ${entry.lord}: ${entry.nakshatra.name}, dignity ${entry.dignity.score}, contribution ${entry.nakshatra.score}`), steps: houseLords.map((entry) => `H${entry.house} → ${entry.nakshatra.name}: ${entry.nakshatra.score >= 0 ? "+" : ""}${entry.nakshatra.score} to ${entry.side}`) } },
    { name: "Essential dignity", scoreA: round(components.dignA), scoreB: round(components.dignB), detail: "Exaltation +2, own sign +1, neutral 0, debilitation −2.", calculation: { formula: "Σ dignity(lord, placement sign)", inputs: houseLords.map((entry) => `H${entry.house} ${entry.lord} in ${entry.placementSign}: ${entry.dignity.status} = ${entry.dignity.score}`), steps: houseLords.map((entry) => `H${entry.house} → ${entry.dignity.status}: ${entry.dignity.score >= 0 ? "+" : ""}${entry.dignity.score} to ${entry.side}`) } },
    { name: "Chaldean Decans", scoreA: round(decanA), scoreB: round(decanB), detail: "0°/10°/20° faces across all 12 signs: +1 own-face dignity and ±0.5 from the decan ruler’s cluster allegiance.", calculation: { formula: "Σ (face dignity + ruler allegiance)", inputs: decans.map((entry) => `${entry.planet} ${entry.sign} ${entry.degreeInSign.toFixed(2)}° → decan ${entry.decan}, ruler ${entry.ruler} H${entry.rulerHouse}: ${entry.score}`), steps: decans.map((entry) => `${entry.planet}: face ${entry.faceDignity >= 0 ? "+" : ""}${entry.faceDignity} + allegiance ${entry.allegiance} = ${entry.score} to ${entry.targetSide}`) } },
    { name: "Planetary war", scoreA: round(components.warA), scoreB: round(components.warB), detail: "Conjunctions within 3° award +1 to the priority winner and −1 to the loser.", calculation: { formula: "Σ (+1 winner, −1 loser) for conjunctions within 3°", inputs: wars.map((war) => `${war.winner} over ${war.loser}: ${war.degreeDifference.toFixed(2)}°`), steps: wars.map((war) => `${war.winner}: +1; ${war.loser}: −1`) } },
    { name: "Arabic Lots", scoreA: round(lotA), scoreB: round(lotB), detail: `${arabicLots.length} source-tagged lots are calculated once per chart and scored by house side.`, calculation: { formula: "Σ lot score by house side; angular houses ×2; Nemesis is negative", inputs: arabicLots.map((lot) => `${lot.name}: ${lot.formulaDay} | night: ${lot.formulaNight}; ${lot.longitude.toFixed(2)}° ${lot.sign}, H${lot.house}, ${lot.side}, score ${lot.score}; source ${lot.source}, ${lot.work}`), steps: arabicLots.map((lot) => `${lot.name} → ${lot.side}: ${lot.score >= 0 ? "+" : ""}${lot.score}; ${lot.reversal}`) } },
    { name: "Arabic mansion context", scoreA: round(mansionA), scoreB: round(mansionB), detail: mansionPairs.length ? mansionPairs.join("; ") : "No pair shares a manzil within the 5° orb. Each body still has its own mansion placement.", calculation: { formula: "Exploratory: all 28 Arabic manzil sectors, all bodies; for same-mansion pairs within 5°, same-side 1 − orb/5; cross-side context only.", inputs: planets.map((planet) => `${planet.planet}: ${planet.manzil?.name ?? "unavailable"}, H${planet.house}, ${sideForHouse(planet.house)}`), steps: mansionPairs.length ? mansionPairs : ["No qualifying co-mansion pair inside 5° orb; legitimate 0/0."] } },
    { name: "Nine-planet influence", scoreA: round(influenceA), scoreB: round(influenceB), detail: "All nine planetary placements across the fixed cluster territories; Sun and Moon carry the established 1.4 signal.", calculation: { formula: "Σ planet weight by house side; Sun/Moon = 1.4, all others = 1.0", inputs: ninePlanetInfluence.map((planet) => `${planet.planet} H${planet.house}: ${planet.side}, weight ${planet.score}`), steps: ninePlanetInfluence.map((planet) => `${planet.planet} → ${planet.side}: ${planet.score >= 0 ? "+" : ""}${planet.score}`) } },
  ];
  return { scoreA: round(scoreA), scoreB: round(scoreB), evidence: { layers, houseLords, planetaryWars: wars, arabicLots, ninePlanetInfluence, decans } };
}

```

## FILE: server/engine/firmamentEngine.ts

Git blob SHA: `de772b3ddfb7050d1f21aea2752b470af027413b`

```typescript
import { houseCusp, locateInHouse } from "./houseFrameFoundation";
import { createRequire } from "node:module";
import type { Body } from "astronomy-engine";
import { calculateRestoredTerritorial, type TerritorialEvidence } from "./territorialStack";

const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine") as typeof import("astronomy-engine");

export const GAME_TYPES = ["MLB", "NBA", "NFL", "NHL", "MLS", "NCAAF", "NCAAB", "TENNIS", "boxing"] as const;
export type GameType = (typeof GAME_TYPES)[number];
export const DOME_MODELS = ["polaris-fixed-ra", "azimuth", "fixed-ecliptic", "unified-ephemeris", "fixed-zodiac-wheel"] as const;
export type DomeModel = (typeof DOME_MODELS)[number];
export type Side = "ascendant" | "descendant" | "neutral";
export type Allegiance = "supports" | "opposes" | "neutral";

export const ASCENDANT_CLUSTER = [1, 2, 3, 6, 10, 11] as const;
export const DESCENDANT_CLUSTER = [4, 5, 7, 8, 9, 12] as const;
// All twelve houses belong to a competitive side. Keep the empty legacy
// collection for compatibility with existing KP evidence/report types.
export const NEUTRAL_HOUSES: readonly number[] = [];
export const NAKSHATRA_ARC_MINUTES = 800;

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;
export const NAKSHATRA_ARC_DEGREES = 360 / 27;
export const MANZIL_ARC_DEGREES = 360 / 28;
export const ARABIC_LUNAR_MANSIONS = [
  "Al-Sharatain", "Al-Butain", "Al-Thurayya", "Al-Dabaran", "Al-Haqa", "Al-Hana",
  "Al-Dhira", "Al-Nathra", "Al-Tarf", "Al-Jabhah", "Al-Zubrah", "Al-Sarfah",
  "Al-Awwa", "Al-Simak", "Al-Ghafr", "Al-Zubana", "Al-Iklil", "Al-Qalb",
  "Al-Shaulah", "Al-Na'amah", "Al-Baldah", "Sa'd al-Dhabih", "Sa'd Bula",
  "Sa'd al-Su'ud", "Sa'd al-Akhbiyah", "Al-Fargh al-Muqaddam", "Al-Fargh al-Mu'akhkhar", "Batn al-Hut",
] as const;
export const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] as const;
export const DASHA_YEARS: Record<(typeof DASHA_SEQUENCE)[number], number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

const BODY_BY_PLANET: Record<string, Body> = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto: Astronomy.Body.Pluto,
};

const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Rahu", "Ketu"] as const;

/**
 * Permanent Pure Clock configuration. The Royal Star rotation is calibrated once
 * from the supplied fixed J2000 RA values and is never recomputed per chart.
 */
export const FIRMAMENT_CONSTANTS = Object.freeze({
  royalStarTargets: Object.freeze({ Aldebaran: 45, Regulus: 135, Antares: 225, Fomalhaut: 315 }),
  royalStarJ2000RA: Object.freeze({ Aldebaran: 68.98, Regulus: 152.09, Antares: 247.35, Fomalhaut: 344.41 }),
  royalStarCalibrationDegrees: 0,
  royalStarToleranceDegrees: 6.25,
  nodeObliquityDegrees: 0,
  fixedJ2000ObliquityDegrees: 0,
  houseSizeDegrees: 30,
});

export type GameInput = {
  teamA: string;
  teamB: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  gameType: GameType;
  startTime: Date;
  /** Optional sunrise anchor used only by the Fixed-Earth Dawn-Anchored AgentView experiment. */
  sunriseTime?: Date;
  sunriseSource?: string;
  agentViewModel?: "astronomical" | "fixed-earth-dawn-anchored";
};

export type KP249Entry = {
  number: number;
  startLongitude: number;
  endLongitude: number;
  nakshatra: string;
  starLord: string;
  subLord: string;
};

export type PlanetReading = {
  planet: string;
  ofDateEclipticLongitude: number;
  /** Absolute 0°–360° wheel used by stars, mansions, decans, and signs. */
  backgroundWheelLongitude: number;
  tropicalLongitude: number;
  fixedJ2000EclipticLongitude: number;
  kpLongitude: number;
  kpCoordinateFrame: "of-date-ecliptic-with-fixed-kp-offset" | "raw-of-date-ecliptic" | "fixed-zodiac-wheel";
  j2000RaDegrees: number;
  j2000DecDegrees: number;
  firmamentRA: number;
  firmamentHouse: number;
  firmamentDegreeInHouse: number;
  degreeInSign: number;
  localSiderealTime: number;
  raHours: number;
  decDegrees: number;
  hourAngle: number;
  azimuth: number;
  altitude: number;
  azimuthDomeDelta: number;
  azimuthHouse: number;
  azimuthDegreeInHouse: number;
  eclipticHouse: number;
  eclipticDegreeInHouse: number;
  isRetrograde: boolean;
  house: number;
  sign: string;
  degreeInHouse: number;
  nakshatra: string;
  pada: 1 | 2 | 3 | 4;
  starLord: string;
  subLord: string;
  manzil: ManzilReading;
};

export type ManzilReading = {
  index: number;
  name: (typeof ARABIC_LUNAR_MANSIONS)[number];
  startLongitude: number;
  endLongitude: number;
  centerLongitude: number;
  degreeInMansion: number;
  centerOrb: number;
};

export type HouseReading = {
  house: number;
  cluster: Side;
  cuspLongitude: number;
  sign: string;
  starLord: string;
  pada: 1 | 2 | 3 | 4;
  subLord: string;
  subLordHouse: number;
  subLordAllegiance: Allegiance;
};

export type LayerVerdict = {
  scoreA: number;
  scoreB: number;
  winner: "A" | "B" | "TIE";
  rationale: string[];
  evidence?: TerritorialEvidence;
  clusterDensity?: KPClusterDensityEvidence;
};

export type KPClusterDensityEvidence = {
  coordinateFrame: "fixed-zodiac-wheel";
  thresholdPercent: number;
  ascendant: { houses: number[]; densityPercent: number; normalizedPeerScore: number; cuspSubLords: Array<{ house: number; subLord: string; connections: number; significations: number[] }> };
  descendant: { houses: number[]; densityPercent: number; normalizedPeerScore: number; cuspSubLords: Array<{ house: number; subLord: string; connections: number; significations: number[] }> };
  differentialPercent: number;
  result: "ASCENDANT" | "DESCENDANT" | "NEUTRAL";
};

export type KPSubSubDetails = {
  adjustedLongitude: number;
  nakshatra: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
  subStartLongitude: number;
  subEndLongitude: number;
  subSubStartLongitude: number;
  subSubEndLongitude: number;
  subWidthDegrees: number;
  subSubWidthDegrees: number;
  vimshottariSequence: string[];
  calculationPrecision: "float64-degrees";
  boundaryRule: "[start,end)";
};

export type KPIntervalSubdivision = {
  lord: string;
  startLongitude: number;
  endLongitude: number;
  widthDegrees: number;
};

export type KPFamilyDirection = "favorable" | "unfavorable" | "neutral";
export type KPResonanceState = "STRONG_REINFORCEMENT" | "REINFORCEMENT" | "NEUTRAL" | "WEAKENING" | "CONTRADICTION";
export type KPFamilySupport = { significations: number[]; favorableHouses: number[]; opposingHouses: number[]; direction: KPFamilyDirection; score: number };

export type KPResonanceConfig = {
  enabled: boolean;
  closeTerritorialMargin: number;
  subLordWeight: number;
  resonanceModifiers: Record<KPResonanceState, number>;
  familyCompatibilityRules: {
    strongReinforcementRequiresSharedFavorableHouse: boolean;
    contradictionRequiresExclusiveOpposition: boolean;
  };
};

export type KPCuspResonanceAudit = {
  house: number;
  teamSide: "A" | "B";
  cuspLongitude: number;
  starLord: string;
  subLord: string;
  subLordInterval: { startLongitude: number; endLongitude: number; widthDegrees: number };
  subLordFamily: { significations: number[]; favorableHouses: number[]; opposingHouses: number[]; direction: KPFamilyDirection; score: number };
  subSubLord: string;
  subSubLordInterval: { startLongitude: number; endLongitude: number; widthDegrees: number };
  subSubLordFamily: { significations: number[]; favorableHouses: number[]; opposingHouses: number[]; direction: KPFamilyDirection; score: number };
  resonance: KPResonanceState;
  primarySubLordContribution: number;
  subSubLordAdjustment: number;
  finalContribution: number;
};

export type KPTerritorialResonanceExperiment = {
  status: "experimental-read-only";
  coordinateFrame: "fixed-zodiac-wheel";
  config: KPResonanceConfig;
  territorial: { scoreA: number; scoreB: number; margin: number; classification: "CLOSE_TERRITORIAL_MATCHUP" | "CLEAR_TERRITORIAL_ADVANTAGE"; winner: "A" | "B" | "TIE"; evidence: TerritorialEvidence };
  ascendant: { team: string; familyScore: number; subLordScore: number; subSubLordAdjustment: number; finalKPWinFit: number; resonanceStates: Record<KPResonanceState, number>; auditChain: KPCuspResonanceAudit[] };
  descendant: { team: string; familyScore: number; subLordScore: number; subSubLordAdjustment: number; finalKPWinFit: number; resonanceStates: Record<KPResonanceState, number>; auditChain: KPCuspResonanceAudit[] };
  resolution: { kpWinner: "A" | "B" | "TIE"; proposedWinner: "A" | "B" | "TIE"; overallConflict: boolean; activeCombinedWinner: "A" | "B" | "TIE"; note: string };
};

export type AscendantHouseResonanceSimulation = Omit<KPTerritorialResonanceExperiment, "coordinateFrame"> & {
  coordinateFrame: "observer-local-ascendant-equal-house";
  ascendantLongitude: number;
};

export type FullLayerFrameAudit = {
  coordinateFrame: "fixed-zodiac-wheel" | "observer-local-ascendant-equal-house";
  houseRule: "permanent-aries-zero-equal-house" | "local-moving-ascendant-equal-house";
  ascendantLongitude?: number;
  territorial: KPTerritorialResonanceExperiment["territorial"];
  kp: Pick<KPTerritorialResonanceExperiment, "ascendant" | "descendant" | "resolution">;
};

export type AgentGodFullLayerExperiment = {
  status: "experimental-read-only";
  input: GameInput;
  config: KPResonanceConfig;
  territorialLayers: readonly [
    "Cluster territory & house-lord placement",
    "Nakshatra influence",
    "Essential dignity",
    "Chaldean Decans",
    "Planetary war",
    "Arabic Lots",
    "Nine-planet influence",
  ];
  god: FullLayerFrameAudit;
  agent: FullLayerFrameAudit;
  boundary: string;
};

export const DEFAULT_KP_RESONANCE_CONFIG: KPResonanceConfig = Object.freeze({
  enabled: false,
  closeTerritorialMargin: 5,
  subLordWeight: 1,
  resonanceModifiers: Object.freeze({
    STRONG_REINFORCEMENT: 0.5,
    REINFORCEMENT: 0.25,
    NEUTRAL: 0,
    WEAKENING: -0.25,
    CONTRADICTION: -0.5,
  }),
  familyCompatibilityRules: Object.freeze({
    strongReinforcementRequiresSharedFavorableHouse: true,
    contradictionRequiresExclusiveOpposition: true,
  }),
});

export type KPSubSubClusterDensityEvidence = {
  coordinateFrame: "fixed-zodiac-wheel";
  thresholdPercent: number;
  ascendant: { houses: number[]; densityPercent: number; cuspSubSubLords: Array<{ house: number; subLord: string; subSubLord: string; connections: number; significations: number[] }> };
  descendant: { houses: number[]; densityPercent: number; cuspSubSubLords: Array<{ house: number; subLord: string; subSubLord: string; connections: number; significations: number[] }> };
  differentialPercent: number;
  result: "ASCENDANT" | "DESCENDANT" | "NEUTRAL";
};

export type FixedJ2000KPSubSubExperiment = {
  status: "experimental-read-only";
  coordinateFrame: "fixed-zodiac-wheel";
  input: GameInput;
  activeFixedKPWinner: "A" | "B" | "TIE";
  activeCombinedWinner: "A" | "B" | "TIE";
  subSubDensity: KPSubSubClusterDensityEvidence;
};

export type MovingKPMatrixLordTrace = {
  lord: string;
  currentHouse: number;
  significations: number[];
  ascendantConnections: number[];
  descendantConnections: number[];
  supportConnections: number[];
  target: "A" | "B" | "NEUTRAL";
};

export type GodViewMovingKPMatrixRow = {
  house: number;
  cuspLongitude: number;
  cuspSign: string;
  houseRole: "PRIMARY" | "SUPPORT";
  houseWeight: number;
  anchorPlanet: string;
  anchorLongitude: number;
  anchorHouse: number;
  nakshatra: string;
  starLord: MovingKPMatrixLordTrace;
  subLord: MovingKPMatrixLordTrace;
  subSubLord: MovingKPMatrixLordTrace;
  coreValue: -2 | -1 | 0 | 1 | 2;
  finalValue: number;
  state: "A_CONFIRMED" | "B_CONFIRMED" | "A_BLOCKED" | "B_BLOCKED" | "A_UNCONFIRMED" | "B_UNCONFIRMED" | "NEUTRAL";
};

export type GodViewMovingKPMatrixExperiment = {
  status: "experimental-read-only";
  coordinateFrame: "fixed-zodiac-wheel";
  input: GameInput;
  activeFixedKPWinner: "A" | "B" | "TIE";
  activeCombinedWinner: "A" | "B" | "TIE";
  rules: { primaryHouseWeight: number; supportHouseWeight: number; noCallThreshold: number; starLordIsAuditableOnly: true };
  rows: GodViewMovingKPMatrixRow[];
  totals: { ascendantStrength: number; descendantStrength: number; supportContribution: number; net: number; winner: "A" | "B" | "TIE"; noCall: boolean };
};

export type KPFullFamilyEvidence = {
  lord: string;
  occupationHouse: number;
  ownershipHouses: number[];
  nodeDispositor?: { lord: string; sign: string; occupationHouse: number; ownershipHouses: number[] };
  significations: number[];
  ascendantHouses: number[];
  descendantHouses: number[];
  supportHouses: number[];
  target: "A" | "B" | "NEUTRAL";
};

export type GodViewFullKPFamilyRow = {
  house: number;
  cuspLongitude: number;
  cuspSign: string;
  fixedCusp: { signLord: string; starLord: string; subLord: string; subSubLord: string };
  cuspSignLord: KPFullFamilyEvidence;
  cuspStarLord: KPFullFamilyEvidence;
  cuspSubLord: KPFullFamilyEvidence;
  cuspSubSubLord: KPFullFamilyEvidence;
  movingAnchor: {
    planet: string;
    longitude: number;
    house: number;
    nakshatra: string;
    starLord: KPFullFamilyEvidence;
    subLord: KPFullFamilyEvidence;
    subSubLord: KPFullFamilyEvidence;
  };
  cuspConnection: { starLordMatches: boolean; subLordMatches: boolean; subSubLordMatches: boolean; movingSubSignifiesCusp: boolean; movingSubSubSignifiesCusp: boolean };
};

export type GodViewFullKPFamilyExperiment = {
  status: "experimental-read-only";
  coordinateFrame: "fixed-zodiac-wheel";
  input: GameInput;
  activeFixedKPWinner: "A" | "B" | "TIE";
  activeCombinedWinner: "A" | "B" | "TIE";
  method: "occupation-ownership-star-sub-cusp-subsub";
  rows: GodViewFullKPFamilyRow[];
};

export type KPFamilyScoreContribution = {
  label: string;
  lord: string;
  target: "A" | "B" | "NEUTRAL";
  baseWeight: number;
  supportContribution: number;
  total: number;
};

export type GodViewPerCuspFamilyScoreRow = {
  house: number;
  cuspSign: string;
  cuspFamily: "A" | "B" | "SUPPORT";
  sourceContributions: KPFamilyScoreContribution[];
  connectionContributions: KPFamilyScoreContribution[];
  sourceSubtotal: number;
  connectionSubtotal: number;
  total: number;
};

export type GodViewPerCuspFamilyScoreExperiment = {
  status: "experimental-read-only";
  coordinateFrame: "fixed-zodiac-wheel";
  input: GameInput;
  activeFixedKPWinner: "A" | "B" | "TIE";
  activeCombinedWinner: "A" | "B" | "TIE";
  rules: { sourceWeights: Record<string, number>; supportHouseIncrement: number; connectionBonuses: Record<string, number>; noCallThreshold: number };
  rows: GodViewPerCuspFamilyScoreRow[];
  totals: { ascendantStrength: number; descendantStrength: number; supportContribution: number; net: number; winner: "A" | "B" | "TIE"; noCall: boolean };
};

export type GodViewDeduplicatedAnchorGroup = {
  anchor: string;
  memberHouses: number[];
  movingChain: { starLord: string; subLord: string; subSubLord: string };
  movingContributions: KPFamilyScoreContribution[];
  selectedConnections: KPFamilyScoreContribution[];
  total: number;
};

export type GodViewDeduplicatedAnchorScoreExperiment = {
  status: "experimental-read-only";
  coordinateFrame: "fixed-zodiac-wheel";
  input: GameInput;
  activeFixedKPWinner: "A" | "B" | "TIE";
  activeCombinedWinner: "A" | "B" | "TIE";
  rules: GodViewPerCuspFamilyScoreExperiment["rules"] & { movingAnchorPolicy: "count-once-per-planet" };
  fixedRows: Array<{ house: number; cuspSign: string; cuspFamily: "A" | "B" | "SUPPORT"; fixedContributions: KPFamilyScoreContribution[]; total: number }>;
  anchorGroups: GodViewDeduplicatedAnchorGroup[];
  totals: { fixedSubtotal: number; movingAnchorSubtotal: number; net: number; winner: "A" | "B" | "TIE"; noCall: boolean };
};

export type Prediction = {
  input: GameInput;
  domeModel: DomeModel;
  venue: { label: string; latitude: number; longitude: number; inferred: boolean };
  localSiderealTime: number;
  kpAyanamsa: number;
  ascendantLongitude: number;
  planets: PlanetReading[];
  houses: HouseReading[];
  territorial: LayerVerdict;
  kpStellar: LayerVerdict;
  combined: LayerVerdict & { confidence: number; agreement: "AGREE" | "DIVERGE" | "TIE" };
};

const KNOWN_VENUES: Array<{ keys: string[]; label: string; latitude: number; longitude: number }> = [
  { keys: ["baltimore", "camden yards"], label: "Baltimore, MD", latitude: 39.2838, longitude: -76.6216 },
  { keys: ["philadelphia", "citizens bank"], label: "Philadelphia, PA", latitude: 39.9061, longitude: -75.1665 },
  { keys: ["new york", "yankee", "citi field", "madison square"], label: "New York, NY", latitude: 40.7128, longitude: -74.006 },
  { keys: ["los angeles", "anaheim", "dodger", "crypto"], label: "Los Angeles, CA", latitude: 34.0522, longitude: -118.2437 },
  { keys: ["boston", "fenway"], label: "Boston, MA", latitude: 42.3601, longitude: -71.0589 },
  { keys: ["chicago", "wrigley", "soldier field"], label: "Chicago, IL", latitude: 41.8781, longitude: -87.6298 },
  { keys: ["las vegas", "t-mobile", "allegiant"], label: "Las Vegas, NV", latitude: 36.1699, longitude: -115.1398 },
];

function normalize(value: number) {
  return ((value % 360) + 360) % 360;
}

/** Return the fixed 28-part Arabic lunar mansion containing an absolute wheel longitude. */
export function manzilFromLongitude(longitude: number): ManzilReading {
  const normalized = normalize(longitude);
  const index = Math.min(ARABIC_LUNAR_MANSIONS.length - 1, Math.floor((normalized + 1e-10) / MANZIL_ARC_DEGREES));
  const startLongitude = index * MANZIL_ARC_DEGREES;
  const centerLongitude = startLongitude + MANZIL_ARC_DEGREES / 2;
  const centerDistance = Math.abs(normalized - centerLongitude);
  return {
    index: index + 1,
    name: ARABIC_LUNAR_MANSIONS[index]!,
    startLongitude: Number(startLongitude.toFixed(6)),
    endLongitude: Number((startLongitude + MANZIL_ARC_DEGREES).toFixed(6)),
    centerLongitude: Number(centerLongitude.toFixed(6)),
    degreeInMansion: Number((normalized - startLongitude).toFixed(6)),
    centerOrb: Number(Math.min(centerDistance, 360 - centerDistance).toFixed(6)),
  };
}

function hashLocation(value: string) {
  return Array.from(value.toLowerCase()).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

export function resolveVenue(location: string) {
  const normalized = location.toLowerCase();
  const known = KNOWN_VENUES.find((venue) => venue.keys.some((key) => normalized.includes(key)));
  if (known) return { ...known, inferred: false };
  const seed = hashLocation(location || "default");
  return {
    label: location || "Unspecified venue",
    latitude: Number((24 + (seed % 2500) / 100).toFixed(4)),
    longitude: Number((-124 + ((seed >>> 8) % 5700) / 100).toFixed(4)),
    inferred: true,
  };
}

/** Exact KP Sub-Lord arc in arc-minutes: Dasha years / 120 × 800. */
export function subLordArcMinutes(planet: (typeof DASHA_SEQUENCE)[number]) {
  return (DASHA_YEARS[planet] / 120) * NAKSHATRA_ARC_MINUTES;
}

/**
 * The 27×9 Sub divisions create 243 star/sub segments. Six segments cross sign
 * boundaries and are split at the boundary, yielding the published 249-entry KP
 * horary map. No equal-width approximation is used.
 */
export function buildKP249Lookup(): KP249Entry[] {
  const rawEntries: Omit<KP249Entry, "number">[] = [];
  for (let nakshatraIndex = 0; nakshatraIndex < 27; nakshatraIndex += 1) {
    const nakshatraStart = nakshatraIndex * (NAKSHATRA_ARC_MINUTES / 60);
    const starLord = DASHA_SEQUENCE[nakshatraIndex % DASHA_SEQUENCE.length];
    const firstSubIndex = DASHA_SEQUENCE.indexOf(starLord);
    let segmentStart = nakshatraStart;
    for (let offset = 0; offset < DASHA_SEQUENCE.length; offset += 1) {
      const subLord = DASHA_SEQUENCE[(firstSubIndex + offset) % DASHA_SEQUENCE.length];
      const segmentEnd = segmentStart + subLordArcMinutes(subLord) / 60;
      const boundaries = [segmentStart];
      const firstSignBoundary = Math.ceil(segmentStart / 30) * 30;
      for (let boundary = firstSignBoundary; boundary < segmentEnd - 1e-10; boundary += 30) {
        if (boundary > segmentStart + 1e-10) boundaries.push(boundary);
      }
      boundaries.push(segmentEnd);
      for (let index = 0; index < boundaries.length - 1; index += 1) {
        rawEntries.push({
          startLongitude: boundaries[index],
          endLongitude: boundaries[index + 1],
          nakshatra: NAKSHATRAS[nakshatraIndex],
          starLord,
          subLord,
        });
      }
      segmentStart = segmentEnd;
    }
  }
  return rawEntries.map((entry, index) => ({ ...entry, number: index + 1 }));
}

export const KP_249_LOOKUP = buildKP249Lookup();

/**
 * The fixed-dome KP reference is the raw permanent dome longitude. No
 * ayanamsa, precession, nutation, or obliquity correction is applied.
 */
export function kpAyanamsa(_date: Date) {
  // Retained as a compatibility export; the fixed-dome model has no ayanamsa.
  return 0;
}

export function kpDetailsFromTropicalLongitude(tropicalLongitude: number, date: Date) {
  return kpDetailsFromCanonicalLongitude(tropicalLongitude, date, false);
}

/**
 * Stellar lookup from the one canonical dome longitude. When `applyKpShift` is
 * false, raw ephemeris longitude is used unchanged for dome, Nakshatra, Pada,
 * Star Lord, and Sub-Lord—no secondary coordinate is created.
 */
export function kpDetailsFromCanonicalLongitude(longitude: number, _date: Date, _applyKpShift: boolean) {
  const adjustedLongitude = normalize(longitude);
  const entry = KP_249_LOOKUP.find((item) => adjustedLongitude >= item.startLongitude - 1e-10 && adjustedLongitude < item.endLongitude - 1e-10)
    ?? KP_249_LOOKUP[KP_249_LOOKUP.length - 1];
  const nakshatraArc = NAKSHATRA_ARC_MINUTES / 60;
  const pada = (Math.floor((adjustedLongitude % nakshatraArc) / (nakshatraArc / 4)) + 1) as 1 | 2 | 3 | 4;
  return { ...entry, adjustedLongitude, pada };
}

/** Create the nine exact Vimshottari-proportional children of one parent interval. */
export function subdivideKPInterval(startLongitude: number, endLongitude: number, startingLord: (typeof DASHA_SEQUENCE)[number]): KPIntervalSubdivision[] {
  const firstIndex = DASHA_SEQUENCE.indexOf(startingLord);
  const width = endLongitude - startLongitude;
  let cursor = startLongitude;
  return DASHA_SEQUENCE.map((_, offset) => {
    const lord = DASHA_SEQUENCE[(firstIndex + offset) % DASHA_SEQUENCE.length];
    const next = offset === DASHA_SEQUENCE.length - 1 ? endLongitude : cursor + (width * DASHA_YEARS[lord] / 120);
    const subdivision = { lord, startLongitude: cursor, endLongitude: next, widthDegrees: next - cursor };
    cursor = next;
    return subdivision;
  });
}

function containingKPSubdivision(longitude: number, subdivisions: KPIntervalSubdivision[]) {
  return subdivisions.find((subdivision) => longitude >= subdivision.startLongitude - 1e-10 && longitude < subdivision.endLongitude - 1e-10)
    ?? subdivisions[subdivisions.length - 1]!;
}

/**
 * Recursively divides the located KP Sub-Lord span by the same Vimshottari
 * proportions. The sequence begins with the current Sub-Lord, exactly as a
 * Nakshatra's Sub-Lord sequence begins with its Star Lord. This is an
 * experimental inspection helper; it does not participate in active verdicts.
 */
export function kpSubSubDetailsFromCanonicalLongitude(longitude: number, date: Date, applyKpShift: boolean): KPSubSubDetails {
  const adjustedLongitude = applyKpShift ? normalize(longitude + kpAyanamsa(date)) : normalize(longitude);
  const nakshatraArcDegrees = NAKSHATRA_ARC_MINUTES / 60;
  const nakshatraIndex = Math.floor(adjustedLongitude / nakshatraArcDegrees) % NAKSHATRAS.length;
  const nakshatraStart = nakshatraIndex * nakshatraArcDegrees;
  const starLord = DASHA_SEQUENCE[nakshatraIndex % DASHA_SEQUENCE.length];
  const sub = containingKPSubdivision(adjustedLongitude, subdivideKPInterval(nakshatraStart, nakshatraStart + nakshatraArcDegrees, starLord));
  const subSubDivisions = subdivideKPInterval(sub.startLongitude, sub.endLongitude, sub.lord as (typeof DASHA_SEQUENCE)[number]);
  const subSub = containingKPSubdivision(adjustedLongitude, subSubDivisions);
  return {
    adjustedLongitude,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    starLord,
    subLord: sub.lord,
    subSubLord: subSub.lord,
    subStartLongitude: sub.startLongitude,
    subEndLongitude: sub.endLongitude,
    subSubStartLongitude: subSub.startLongitude,
    subSubEndLongitude: subSub.endLongitude,
    subWidthDegrees: sub.widthDegrees,
    subSubWidthDegrees: subSub.widthDegrees,
    vimshottariSequence: subSubDivisions.map((division) => division.lord),
    calculationPrecision: "float64-degrees",
    boundaryRule: "[start,end)",
  };
}

/** East = H1 / Aries; 30° sectors proceed counter-clockwise through the fixed dome. */
export function fixedDomeHouseFromAzimuth(azimuth: number) {
  const delta = normalize(90 - azimuth);
  const house = Math.floor(delta / 30) + 1;
  return { house, degreeInHouse: delta % 30, sign: SIGNS[house - 1] };
}

/**
 * Polaris-centered Pure Clock sector map. `firmamentRA` is a permanent J2000
 * equatorial angle plus the one-time Royal Star rotation; no venue, LST, horizon,
 * altitude, or azimuth value participates in this house calculation.
 */
export function fixedFirmamentHouseFromRA(firmamentRA: number) {
  // Compatibility name retained; the fixed dome maps raw longitude directly.
  const normalizedLongitude = normalize(firmamentRA);
  const house = Math.floor(normalizedLongitude / FIRMAMENT_CONSTANTS.houseSizeDegrees) + 1;
  return { house, degreeInHouse: normalizedLongitude % FIRMAMENT_CONSTANTS.houseSizeDegrees, sectorSign: SIGNS[house - 1] };
}

/**
 * Literal Fixed Ecliptic Dome: raw ephemeris longitude is the permanent
 * sign-house position. H1/Aries begins at 0° and advances in fixed 30° sectors.
 * This function deliberately does not use azimuth, LST, or venue coordinates.
 */
export function fixedEclipticHouseFromLongitude(longitude: number) {
  const { house, degreeInHouse } = locateInHouse(longitude, "god", 0);
  return { house, degreeInHouse, sign: SIGNS[house - 1] };
}

export type EqualHouseZonePlacement = {
  centerHouse: number;
  segments: Array<{ house: number; startLongitude: number; endLongitude: number; degrees: number; percentage: number }>;
};

/** Maps a fixed 360° zone into the local equal-house wheel without moving the zone itself. */
export function equalHouseZonePlacement(startLongitude: number, endLongitude: number, ascendantLongitude: number): EqualHouseZonePlacement {
  const width = Math.max(0, endLongitude - startLongitude);
  const displayLongitude = (value: number) => Math.abs(value - 360) < 1e-9 ? 360 : Number(normalize(value).toFixed(6));
  const boundaries = [startLongitude, endLongitude];
  for (let index = -12; index <= 24; index += 1) {
    const boundary = normalize(ascendantLongitude) + index * 30;
    if (boundary > startLongitude + 1e-9 && boundary < endLongitude - 1e-9) boundaries.push(boundary);
  }
  boundaries.sort((left, right) => left - right);
  const segments = boundaries.slice(0, -1).map((left, index) => {
    const right = boundaries[index + 1]!;
    const midpoint = (left + right) / 2;
    const house = fixedEclipticHouseFromLongitude(midpoint - ascendantLongitude).house;
    const degrees = right - left;
    return { house, startLongitude: displayLongitude(left), endLongitude: displayLongitude(right), degrees: Number(degrees.toFixed(6)), percentage: width ? Number((degrees / width * 100).toFixed(2)) : 0 };
  });
  const centerHouse = fixedEclipticHouseFromLongitude((startLongitude + endLongitude) / 2 - ascendantLongitude).house;
  return { centerHouse, segments };
}

export function clusterForHouse(house: number): Side {
  if ((ASCENDANT_CLUSTER as readonly number[]).includes(house)) return "ascendant";
  if ((DESCENDANT_CLUSTER as readonly number[]).includes(house)) return "descendant";
  return "neutral";
}

export function allegiance(planetHouse: number, targetCluster: Side): Allegiance {
  const actual = clusterForHouse(planetHouse);
  if (actual === "neutral") return "neutral";
  return actual === targetCluster ? "supports" : "opposes";
}

function signForLongitude(longitude: number) {
  return SIGNS[Math.floor(normalize(longitude) / 30)];
}

export function calculateAscendantLongitude(date: Date, _latitude: number, longitude: number) {
  // Local horizon intersection with the permanent zero-tilt dome. Latitude
  // drops out when the dome equator and ecliptic are coincident; longitude and
  // time still make the local Ascendant individualized.
  const gstHours = Astronomy.SiderealTime(Astronomy.MakeTime(date));
  return normalize(gstHours * 15 + longitude + 270);
}

function nodeLongitude(date: Date) {
  const days = (date.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / 86400000;
  return normalize(125.04452 - 0.0529538083 * days);
}

function nodeRaDec(longitude: number) {
  return { raHours: normalize(longitude) / 15, decDegrees: 0 };
}

function geocentricEclipticLongitude(body: Body, date: Date) {
  return fixedDomeLongitude(body, date);
}

function fixedDomeLongitude(body: Body, date: Date) {
  const vector = Astronomy.GeoVector(body, date, false);
  return normalize(Math.atan2(vector.y, vector.x) * 180 / Math.PI);
}

/** Geocentric fixed J2000 equatorial coordinates: no observer or of-date rotation. */
function geocentricJ2000Equatorial(body: Body, date: Date) {
  const sphere = Astronomy.SphereFromVector(Astronomy.GeoVector(body, date, false));
  return { raDegrees: normalize(sphere.lon), decDegrees: sphere.lat };
}

/**
 * Converts an EQJ/J2000 geocentric vector into a permanent J2000 ecliptic
 * longitude. This intentionally avoids the library's Ecliptic() helper,
 * which precesses/nutates to the true ecliptic and true obliquity of date.
 */
export function fixedJ2000EclipticLongitudeFromEquatorialVector(vector: { x: number; y: number; z: number }) {
  // The fixed dome deliberately projects onto a zero-tilt X/Y plane.
  return normalize(Math.atan2(vector.y, vector.x) * 180 / Math.PI);
}

/** Geocentric J2000 ecliptic longitude with fixed J2000 obliquity and no aberration. */
function geocentricFixedJ2000EclipticLongitude(body: Body, date: Date) {
  return fixedDomeLongitude(body, date);
}

function firmamentCoordinateFromJ2000RA(raDegrees: number) {
  return normalize(raDegrees);
}

function buildPlanetReadings(date: Date, venue: { latitude: number; longitude: number }, domeModel: DomeModel = "azimuth") {
  const localSiderealTime = normalize(Astronomy.SiderealTime(Astronomy.MakeTime(date)) * 15 + venue.longitude);
  const ascendantLongitude = calculateAscendantLongitude(date, venue.latitude, venue.longitude);
  const usesFixedJ2000KP = domeModel === "fixed-zodiac-wheel";
  const readings: PlanetReading[] = [];
  for (const planet of PLANETS) {
    const ofDateLongitude = planet === "Rahu" ? nodeLongitude(date) : planet === "Ketu" ? normalize(nodeLongitude(date) + 180) : geocentricEclipticLongitude(BODY_BY_PLANET[planet], date);
    const backgroundWheelLongitude = ofDateLongitude;
    const fixedJ2000EclipticLongitude = planet === "Rahu" ? nodeLongitude(date) : planet === "Ketu" ? normalize(nodeLongitude(date) + 180) : geocentricFixedJ2000EclipticLongitude(BODY_BY_PLANET[planet], date);
    const nextDate = new Date(date.getTime() + 86400000);
    const followingOfDateLongitude = planet === "Rahu" ? nodeLongitude(nextDate) : planet === "Ketu" ? normalize(nodeLongitude(nextDate) + 180) : geocentricEclipticLongitude(BODY_BY_PLANET[planet], nextDate);
    // Canonical reference is always of-date now; fixedJ2000EclipticLongitude is
    // retained below purely as an audit/legacy field, never as a driver of
    // house, stellar, or degree-in-sign math.
    const tropicalLongitude = ofDateLongitude;
    const followingLongitude = followingOfDateLongitude;
    const j2000Equatorial = planet === "Rahu" || planet === "Ketu"
      ? (() => {
          const node = nodeRaDec(ofDateLongitude);
          return { raDegrees: node.raHours * 15, decDegrees: node.decDegrees };
        })()
      : geocentricJ2000Equatorial(BODY_BY_PLANET[planet], date);
    const equatorial = { raHours: j2000Equatorial.raDegrees / 15, decDegrees: j2000Equatorial.decDegrees };
    const horizontal = { azimuth: 0, altitude: 0 };
    const azimuthDome = fixedDomeHouseFromAzimuth(horizontal.azimuth);
    // eclipticDome is God View: a permanent Aries-zero wheel applied to the
    // real of-date planet position (fixed house wheel, moving sky).
    const eclipticDome = fixedEclipticHouseFromLongitude(backgroundWheelLongitude);
    const firmamentRA = firmamentCoordinateFromJ2000RA(j2000Equatorial.raDegrees);
    const firmamentDome = fixedFirmamentHouseFromRA(firmamentRA);
    // Compatibility model names remain in the API, but every active model now
    // resolves to the same permanent raw fixed-dome sectors.
    void domeModel;
    void usesFixedJ2000KP;
    // The background wheel is absolute and shared by both views. AgentView
    // uses exact-degree equal houses; God View keeps the fixed Aries-zero wheel.
    const localHouse = locateInHouse(backgroundWheelLongitude, "agent", ascendantLongitude);
    const dome = domeModel === "fixed-zodiac-wheel"
      ? eclipticDome
      : { ...eclipticDome, house: localHouse.house, degreeInHouse: localHouse.degreeInHouse };
    const stellar = kpDetailsFromCanonicalLongitude(backgroundWheelLongitude, date, domeModel !== "unified-ephemeris");
    const manzil = manzilFromLongitude(backgroundWheelLongitude);
    readings.push({
      planet,
      ofDateEclipticLongitude: ofDateLongitude,
      backgroundWheelLongitude,
      tropicalLongitude,
      fixedJ2000EclipticLongitude,
      kpLongitude: stellar.adjustedLongitude,
      kpCoordinateFrame: domeModel === "unified-ephemeris"
        ? "raw-of-date-ecliptic"
        : "of-date-ecliptic-with-fixed-kp-offset",
      j2000RaDegrees: j2000Equatorial.raDegrees,
      j2000DecDegrees: j2000Equatorial.decDegrees,
      firmamentRA,
      firmamentHouse: firmamentDome.house,
      firmamentDegreeInHouse: firmamentDome.degreeInHouse,
      degreeInSign: eclipticDome.degreeInHouse,
      localSiderealTime,
      raHours: equatorial.raHours,
      decDegrees: equatorial.decDegrees,
      hourAngle: ((localSiderealTime - equatorial.raHours * 15 + 540) % 360) - 180,
      azimuth: horizontal.azimuth,
      altitude: horizontal.altitude,
      azimuthDomeDelta: normalize(90 - horizontal.azimuth),
      azimuthHouse: azimuthDome.house,
      azimuthDegreeInHouse: azimuthDome.degreeInHouse,
      eclipticHouse: eclipticDome.house,
      eclipticDegreeInHouse: eclipticDome.degreeInHouse,
      isRetrograde: ((followingLongitude - tropicalLongitude + 540) % 360) - 180 < 0,
      house: dome.house,
      sign: signForLongitude(tropicalLongitude),
      degreeInHouse: dome.degreeInHouse,
      nakshatra: stellar.nakshatra,
      pada: stellar.pada,
      starLord: stellar.starLord,
      subLord: stellar.subLord,
      manzil,
    });
  }
  return readings;
}

/**
 * Public fixed-cosmic placement helper for natal and transit readings. It uses
 * moving geocentric bodies in the permanent J2000 ecliptic frame; venue values
 * are neutral placeholders and cannot affect returned fixed placements.
 */
export function generateFixedJ2000PlanetReadings(date: Date) {
  return buildPlanetReadings(date, { latitude: 0, longitude: 0 }, "fixed-zodiac-wheel");
}

function layerWinner(scoreA: number, scoreB: number): "A" | "B" | "TIE" {
  if (Math.abs(scoreA - scoreB) < 0.001) return "TIE";
  return scoreA > scoreB ? "A" : "B";
}

function territorialVerdict(planets: PlanetReading[], ascendantLongitude: number, lotHouseFromLongitude: (longitude: number) => number): LayerVerdict {
  const restored = calculateRestoredTerritorial(planets, ascendantLongitude, lotHouseFromLongitude);
  const rationale = restored.evidence.layers.map((layer) => `${layer.name}: ${layer.scoreA >= 0 ? "+" : ""}${layer.scoreA.toFixed(2)} Ascendant / ${layer.scoreB >= 0 ? "+" : ""}${layer.scoreB.toFixed(2)} Descendant. ${layer.detail}`);
  return { scoreA: restored.scoreA, scoreB: restored.scoreB, winner: layerWinner(restored.scoreA, restored.scoreB), rationale, evidence: restored.evidence };
}

function fixedClusterSignifications(planet: string, positionHouse: number) {
  const significations = new Set<number>([positionHouse]);
  const ownership: Record<string, number[]> = {
    Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11], Rahu: [11], Ketu: [8],
  };
  ownership[planet]?.forEach((house) => significations.add(house));
  significations.add(((positionHouse + 5) % 12) + 1);
  if (planet === "Rahu" || planet === "Ketu") {
    [4, 6, 8].forEach((offset) => significations.add(((positionHouse + offset - 1) % 12) + 1));
  }
  return Array.from(significations).sort((left, right) => left - right);
}

function clusterDensityVerdict(planets: PlanetReading[]): LayerVerdict {
  const densityFor = (cluster: readonly number[]) => {
    const cuspSubLords = cluster.map((house) => {
      const cusp = kpDetailsFromCanonicalLongitude((house - 1) * 30, new Date("2000-01-01T12:00:00Z"), false);
      const placement = planets.find((planet) => planet.planet === cusp.subLord) ?? planets[0]!;
      const significations = fixedClusterSignifications(cusp.subLord, placement.house);
      const connections = significations.filter((signification) => cluster.includes(signification)).length;
      return { house, subLord: cusp.subLord, connections, significations };
    });
    const densityPercent = Number((cuspSubLords.reduce((total, cusp) => total + cusp.connections, 0) / (cluster.length ** 2) * 100).toFixed(2));
    return { houses: [...cluster], densityPercent, normalizedPeerScore: Number((densityPercent / 10).toFixed(2)), cuspSubLords };
  };
  const ascendant = densityFor(ASCENDANT_CLUSTER);
  const descendant = densityFor(DESCENDANT_CLUSTER);
  const differentialPercent = Number((descendant.densityPercent - ascendant.densityPercent).toFixed(2));
  const result = differentialPercent > 2 ? "DESCENDANT" : differentialPercent < -2 ? "ASCENDANT" : "NEUTRAL";
  const evidence: KPClusterDensityEvidence = {
    coordinateFrame: "fixed-zodiac-wheel",
    thresholdPercent: 2,
    ascendant,
    descendant,
    differentialPercent,
    result,
  };
  return {
    scoreA: ascendant.normalizedPeerScore,
    scoreB: descendant.normalizedPeerScore,
    winner: result === "ASCENDANT" ? "A" : result === "DESCENDANT" ? "B" : "TIE",
    rationale: [
      `Fixed J2000 KP cluster density: Ascendant ${ascendant.densityPercent.toFixed(2)}% across H1/H3/H6/H10/H11; Descendant ${descendant.densityPercent.toFixed(2)}% across H7/H9/H12/H4/H5.`,
      `Descendant minus Ascendant density = ${differentialPercent >= 0 ? "+" : ""}${differentialPercent.toFixed(2)}%; the fixed ±2.00% threshold resolves ${result.toLowerCase()}.`,
      "Each cusp uses its fixed Nakshatra Sub-Lord; significations combine fixed-sector occupancy, traditional fixed-sign rulership, seventh aspect, and node fifth/seventh/ninth aspects. Density is retained as raw evidence and divided by 10 only for equal-peer synthesis with Territorial Control.",
    ],
    clusterDensity: evidence,
  };
}

function subSubClusterDensityExperiment(planets: PlanetReading[]): KPSubSubClusterDensityEvidence {
  const densityFor = (cluster: readonly number[]) => {
    const cuspSubSubLords = cluster.map((house) => {
      const cusp = kpSubSubDetailsFromCanonicalLongitude((house - 1) * 30, new Date("2000-01-01T12:00:00Z"), false);
      const placement = planets.find((planet) => planet.planet === cusp.subSubLord) ?? planets[0]!;
      const significations = fixedClusterSignifications(cusp.subSubLord, placement.house);
      const connections = significations.filter((signification) => cluster.includes(signification)).length;
      return { house, subLord: cusp.subLord, subSubLord: cusp.subSubLord, connections, significations };
    });
    const densityPercent = Number((cuspSubSubLords.reduce((total, cusp) => total + cusp.connections, 0) / (cluster.length ** 2) * 100).toFixed(2));
    return { houses: [...cluster], densityPercent, cuspSubSubLords };
  };
  const ascendant = densityFor(ASCENDANT_CLUSTER);
  const descendant = densityFor(DESCENDANT_CLUSTER);
  const differentialPercent = Number((descendant.densityPercent - ascendant.densityPercent).toFixed(2));
  return {
    coordinateFrame: "fixed-zodiac-wheel",
    thresholdPercent: 2,
    ascendant,
    descendant,
    differentialPercent,
    result: differentialPercent > 2 ? "DESCENDANT" : differentialPercent < -2 ? "ASCENDANT" : "NEUTRAL",
  };
}

function familySupport(significations: number[], targetSide: "A" | "B"): KPFamilySupport {
  const targetCluster = targetSide === "A" ? ASCENDANT_CLUSTER : DESCENDANT_CLUSTER;
  const opposingCluster = targetSide === "A" ? DESCENDANT_CLUSTER : ASCENDANT_CLUSTER;
  const favorableHouses = significations.filter((house) => targetCluster.includes(house as never));
  const opposingHouses = significations.filter((house) => opposingCluster.includes(house as never));
  const score = favorableHouses.length - opposingHouses.length;
  const direction: KPFamilyDirection = score > 0 ? "favorable" : score < 0 ? "unfavorable" : "neutral";
  return { significations, favorableHouses, opposingHouses, direction, score };
}

function resolveMovingMatrixLord(lord: string, planets: PlanetReading[]): MovingKPMatrixLordTrace {
  const placement = planets.find((planet) => planet.planet === lord) ?? planets[0]!;
  const significations = fixedClusterSignifications(lord, placement.house);
  const ascendantConnections = significations.filter((house) => ASCENDANT_CLUSTER.includes(house as never));
  const descendantConnections = significations.filter((house) => DESCENDANT_CLUSTER.includes(house as never));
  const supportConnections = significations.filter((house) => NEUTRAL_HOUSES.includes(house as never));
  const target = ascendantConnections.length > descendantConnections.length
    ? "A"
    : descendantConnections.length > ascendantConnections.length
      ? "B"
      : "NEUTRAL";
  return { lord, currentHouse: placement.house, significations, ascendantConnections, descendantConnections, supportConnections, target };
}

const FIXED_SIGN_RULERS: Record<string, string> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun", Virgo: "Mercury",
  Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

const FIXED_OWNERSHIP: Record<string, number[]> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

function resolveFullKPFamilyLord(lord: string, planets: PlanetReading[]): KPFullFamilyEvidence {
  const placement = planets.find((planet) => planet.planet === lord) ?? planets[0]!;
  const ownershipHouses = [...(FIXED_OWNERSHIP[lord] ?? [])];
  let nodeDispositor: KPFullFamilyEvidence["nodeDispositor"];
  const significations = new Set<number>([placement.house, ...ownershipHouses]);
  if (lord === "Rahu" || lord === "Ketu") {
    const dispositorLord = FIXED_SIGN_RULERS[placement.sign] ?? "Mars";
    const dispositor = planets.find((planet) => planet.planet === dispositorLord) ?? planets[0]!;
    const dispositorOwnership = [...(FIXED_OWNERSHIP[dispositorLord] ?? [])];
    nodeDispositor = { lord: dispositorLord, sign: placement.sign, occupationHouse: dispositor.house, ownershipHouses: dispositorOwnership };
    significations.add(dispositor.house);
    dispositorOwnership.forEach((house) => significations.add(house));
  }
  const all = Array.from(significations).sort((left, right) => left - right);
  const ascendantHouses = all.filter((house) => ASCENDANT_CLUSTER.includes(house as never));
  const descendantHouses = all.filter((house) => DESCENDANT_CLUSTER.includes(house as never));
  const supportHouses = all.filter((house) => NEUTRAL_HOUSES.includes(house as never));
  const target = ascendantHouses.length > descendantHouses.length
    ? "A"
    : descendantHouses.length > ascendantHouses.length
      ? "B"
      : "NEUTRAL";
  return { lord, occupationHouse: placement.house, ownershipHouses, nodeDispositor, significations: all, ascendantHouses, descendantHouses, supportHouses, target };
}

function movingMatrixCoreValue(subTarget: MovingKPMatrixLordTrace["target"], subSubTarget: MovingKPMatrixLordTrace["target"]) {
  if (subTarget === "A" && subSubTarget === "A") return { coreValue: 2 as const, state: "A_CONFIRMED" as const };
  if (subTarget === "B" && subSubTarget === "B") return { coreValue: -2 as const, state: "B_CONFIRMED" as const };
  if (subTarget === "A" && subSubTarget === "B") return { coreValue: 0 as const, state: "A_BLOCKED" as const };
  if (subTarget === "B" && subSubTarget === "A") return { coreValue: 0 as const, state: "B_BLOCKED" as const };
  if (subTarget === "A") return { coreValue: 1 as const, state: "A_UNCONFIRMED" as const };
  if (subTarget === "B") return { coreValue: -1 as const, state: "B_UNCONFIRMED" as const };
  return { coreValue: 0 as const, state: "NEUTRAL" as const };
}

export function classifyKPResonanceState(subFamily: KPFamilySupport, subSubFamily: KPFamilySupport, config: KPResonanceConfig): KPResonanceState {
  if (subFamily.direction === "neutral" || subSubFamily.direction === "neutral") return "NEUTRAL";
  if (subFamily.direction === subSubFamily.direction) {
    const subHouses = subFamily.direction === "favorable" ? subFamily.favorableHouses : subFamily.opposingHouses;
    const subSubHouses = subSubFamily.direction === "favorable" ? subSubFamily.favorableHouses : subSubFamily.opposingHouses;
    const sharedHouse = subHouses.some((house) => subSubHouses.includes(house));
    return !config.familyCompatibilityRules.strongReinforcementRequiresSharedFavorableHouse || sharedHouse ? "STRONG_REINFORCEMENT" : "REINFORCEMENT";
  }
  const directOpposition = subSubFamily.favorableHouses.length === 0 && subSubFamily.opposingHouses.length >= 2;
  return config.familyCompatibilityRules.contradictionRequiresExclusiveOpposition && directOpposition ? "CONTRADICTION" : "WEAKENING";
}

function emptyResonanceStateCounts(): Record<KPResonanceState, number> {
  return { STRONG_REINFORCEMENT: 0, REINFORCEMENT: 0, NEUTRAL: 0, WEAKENING: 0, CONTRADICTION: 0 };
}

function resolveKPResonanceConfig(override?: Partial<KPResonanceConfig>): KPResonanceConfig {
  return {
    ...DEFAULT_KP_RESONANCE_CONFIG,
    ...override,
    resonanceModifiers: { ...DEFAULT_KP_RESONANCE_CONFIG.resonanceModifiers, ...override?.resonanceModifiers },
    familyCompatibilityRules: { ...DEFAULT_KP_RESONANCE_CONFIG.familyCompatibilityRules, ...override?.familyCompatibilityRules },
  };
}

function resonanceAuditForSide(planets: PlanetReading[], targetSide: "A" | "B", config: KPResonanceConfig, cuspOffset = 0, applyKpShift = false) {
  const cluster = targetSide === "A" ? ASCENDANT_CLUSTER : DESCENDANT_CLUSTER;
  const auditChain = cluster.map((house) => {
    const cuspLongitude = houseCusp(house, "agent", cuspOffset);
    const details = kpSubSubDetailsFromCanonicalLongitude(cuspLongitude, new Date("2000-01-01T12:00:00Z"), applyKpShift);
    const subPlacement = planets.find((planet) => planet.planet === details.subLord) ?? planets[0]!;
    const subSubPlacement = planets.find((planet) => planet.planet === details.subSubLord) ?? planets[0]!;
    const subLordFamily = familySupport(fixedClusterSignifications(details.subLord, subPlacement.house), targetSide);
    const subSubLordFamily = familySupport(fixedClusterSignifications(details.subSubLord, subSubPlacement.house), targetSide);
    const resonance = classifyKPResonanceState(subLordFamily, subSubLordFamily, config);
    const primarySubLordContribution = subLordFamily.score * config.subLordWeight;
    const primaryDirection = Math.sign(primarySubLordContribution || subLordFamily.score);
    const subSubLordAdjustment = config.enabled ? primaryDirection * config.resonanceModifiers[resonance] : 0;
    return {
      house,
      teamSide: targetSide,
      cuspLongitude,
      starLord: details.starLord,
      subLord: details.subLord,
      subLordInterval: { startLongitude: details.subStartLongitude, endLongitude: details.subEndLongitude, widthDegrees: details.subWidthDegrees },
      subLordFamily,
      subSubLord: details.subSubLord,
      subSubLordInterval: { startLongitude: details.subSubStartLongitude, endLongitude: details.subSubEndLongitude, widthDegrees: details.subSubWidthDegrees },
      subSubLordFamily,
      resonance,
      primarySubLordContribution,
      subSubLordAdjustment,
      finalContribution: primarySubLordContribution + subSubLordAdjustment,
    } satisfies KPCuspResonanceAudit;
  });
  const resonanceStates = emptyResonanceStateCounts();
  auditChain.forEach((entry) => { resonanceStates[entry.resonance] += 1; });
  return {
    familyScore: auditChain.reduce((sum, entry) => sum + entry.subLordFamily.score, 0),
    subLordScore: auditChain.reduce((sum, entry) => sum + entry.primarySubLordContribution, 0),
    subSubLordAdjustment: auditChain.reduce((sum, entry) => sum + entry.subSubLordAdjustment, 0),
    finalKPWinFit: auditChain.reduce((sum, entry) => sum + entry.finalContribution, 0),
    resonanceStates,
    auditChain,
  };
}

function kpVerdict(houses: HouseReading[], planets: PlanetReading[], domeModel: DomeModel): LayerVerdict {
  if (domeModel === "fixed-zodiac-wheel") return clusterDensityVerdict(planets);
  let scoreA = 0;
  let scoreB = 0;
  const rationale: string[] = [];
  for (const house of houses.filter((item) => item.cluster !== "neutral")) {
    const points = house.subLordAllegiance === "supports" ? 2 : house.subLordAllegiance === "opposes" ? -2 : 0;
    if (house.cluster === "ascendant") scoreA += points;
    if (house.cluster === "descendant") scoreB += points;
    rationale.push(`H${house.house} cusp ${house.subLord} resolves ${house.subLordAllegiance} through H${house.subLordHouse}.`);
  }
  return { scoreA, scoreB, winner: layerWinner(scoreA, scoreB), rationale };
}

export function generatePredictionForModel(input: GameInput, domeModel: DomeModel): Prediction {
  const venue = input.coordinates
    ? { label: input.location, latitude: input.coordinates.latitude, longitude: input.coordinates.longitude, inferred: false }
    : resolveVenue(input.location);
  const planets = buildPlanetReadings(input.startTime, venue, domeModel);
  const ascendantLongitude = calculateAscendantLongitude(input.startTime, venue.latitude, venue.longitude);
  const planetsByName = new Map(planets.map((planet) => [planet.planet, planet]));
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, domeModel === "fixed-zodiac-wheel" ? "god" : "agent", ascendantLongitude);
    const stellar = kpDetailsFromCanonicalLongitude(cuspLongitude, input.startTime, domeModel !== "unified-ephemeris");
    const subLordPlacement = planetsByName.get(stellar.subLord) ?? planets[0];
    const cluster = clusterForHouse(house);
    return {
      house,
      cluster,
      cuspLongitude,
      sign: signForLongitude(cuspLongitude),
      starLord: stellar.starLord,
      pada: stellar.pada,
      subLord: stellar.subLord,
      subLordHouse: subLordPlacement.house,
      subLordAllegiance: cluster === "neutral" ? "neutral" : allegiance(subLordPlacement.house, cluster),
    };
  });
  const houseAnchor = domeModel === "fixed-zodiac-wheel" ? 0 : ascendantLongitude;
  const lotHouseFromLongitude = (longitude: number) => locateInHouse(longitude, domeModel === "fixed-zodiac-wheel" ? "god" : "agent", houseAnchor).house;
  const territorial = territorialVerdict(planets, ascendantLongitude, lotHouseFromLongitude);
  const kpStellar = kpVerdict(houses, planets, domeModel);
  const territorialWeight = 0.4;
  const kpWeight = 0.6;
  const combinedScoreA = territorial.scoreA * territorialWeight + kpStellar.scoreA * kpWeight;
  const combinedScoreB = territorial.scoreB * territorialWeight + kpStellar.scoreB * kpWeight;
  const combinedWinner = layerWinner(combinedScoreA, combinedScoreB);
  const agreement = territorial.winner === "TIE" || kpStellar.winner === "TIE"
    ? "TIE"
    : territorial.winner === kpStellar.winner ? "AGREE" : "DIVERGE";
  const confidence = Math.min(95, Math.round(50 + Math.abs(combinedScoreA - combinedScoreB) * 5 + (agreement === "AGREE" ? 12 : 0)));
  return {
    input,
    domeModel,
    venue,
    localSiderealTime: normalize(Astronomy.SiderealTime(Astronomy.MakeTime(input.startTime)) * 15 + venue.longitude),
    kpAyanamsa: 0,
    ascendantLongitude,
    planets,
    houses,
    territorial,
    kpStellar,
    combined: {
      scoreA: combinedScoreA,
      scoreB: combinedScoreB,
      winner: combinedWinner,
      confidence,
      agreement,
      rationale: [
        "KP Stellar leads the synthesis at 60%; Territorial Control contributes the remaining 40% as an independent challenger layer.",
        agreement === "DIVERGE" ? "The layers diverge; inspect the house-by-house KP chain before treating the call as high-conviction." : "The layers are aligned in the final reading.",
      ],
    },
  };
}

/** Active fixed dome: raw zero-tilt longitude mapped to permanent sectors. */
export function generatePrediction(input: GameInput) {
  return generatePredictionForModel(input, "polaris-fixed-ra");
}

/** Legacy comparison: topocentric azimuth assigned to Fixed Dome sectors. */
export function generateAzimuthLegacyPrediction(input: GameInput) {
  return generatePredictionForModel(input, "azimuth");
}

/** Explicit access to the active Polaris-centered fixed-RA Pure Clock model. */
export function generatePolarisFixedRAPrediction(input: GameInput) {
  return generatePredictionForModel(input, "polaris-fixed-ra");
}

/** Experimental model: raw ephemeris longitude assigned directly to fixed sign-house sectors. */
export function generateFixedEclipticPrediction(input: GameInput) {
  return generatePredictionForModel(input, "fixed-ecliptic");
}

/**
 * Clean literal-ephemeris experiment: one raw longitude is shared by the
 * permanent dome sector and the complete KP stellar chain, with zero offset.
 */
export function generateUnifiedEphemerisPrediction(input: GameInput) {
  return generatePredictionForModel(input, "unified-ephemeris");
}

/**
 * Fixed-Firmament KP Event Engine: moving geocentric bodies projected into a
 * permanent J2000 ecliptic, fixed 0° Aries, fixed Nakshatras, and zero ayanamsa.
 */
export function generateFixedJ2000KPPrediction(input: GameInput) {
  return generatePredictionForModel(input, "fixed-zodiac-wheel");
}

/**
 * Deeper Fixed J2000 KP inspection path. It remains read-only and does not
 * feed Territorial Control, active Sub-Lord density, or combined scoring.
 */
export function runFixedJ2000KPSubSubExperiment(input: GameInput): FixedJ2000KPSubSubExperiment {
  const activePrediction = generateFixedJ2000KPPrediction(input);
  return {
    status: "experimental-read-only",
    coordinateFrame: "fixed-zodiac-wheel",
    input,
    activeFixedKPWinner: activePrediction.kpStellar.winner,
    activeCombinedWinner: activePrediction.combined.winner,
    subSubDensity: subSubClusterDensityExperiment(activePrediction.planets),
  };
}

/**
 * Read-only full 12-cusp God View experiment. Cusps stay permanent while each
 * cusp anchor's exact current Star → Sub → Sub–Sub chain refreshes by game time.
 */
export function runGodViewMovingKPMatrixExperiment(input: GameInput): GodViewMovingKPMatrixExperiment {
  const activePrediction = generateFixedJ2000KPPrediction(input);
  const primaryHouseWeight = 1;
  const supportHouseWeight = 0.35;
  const noCallThreshold = 0.5;
  const rows = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, "god", 0);
    const cusp = kpSubSubDetailsFromCanonicalLongitude(cuspLongitude, new Date("2000-01-01T12:00:00Z"), false);
    const anchor = activePrediction.planets.find((planet) => planet.planet === cusp.subLord) ?? activePrediction.planets[0]!;
    const moving = kpSubSubDetailsFromCanonicalLongitude(anchor.fixedJ2000EclipticLongitude, input.startTime, false);
    const starLord = resolveMovingMatrixLord(moving.starLord, activePrediction.planets);
    const subLord = resolveMovingMatrixLord(moving.subLord, activePrediction.planets);
    const subSubLord = resolveMovingMatrixLord(moving.subSubLord, activePrediction.planets);
    const { coreValue, state } = movingMatrixCoreValue(subLord.target, subSubLord.target);
    const houseRole = NEUTRAL_HOUSES.includes(house as never) ? "SUPPORT" as const : "PRIMARY" as const;
    const houseWeight = houseRole === "SUPPORT" ? supportHouseWeight : primaryHouseWeight;
    return {
      house,
      cuspLongitude,
      cuspSign: signForLongitude(cuspLongitude),
      houseRole,
      houseWeight,
      anchorPlanet: anchor.planet,
      anchorLongitude: anchor.fixedJ2000EclipticLongitude,
      anchorHouse: anchor.house,
      nakshatra: moving.nakshatra,
      starLord,
      subLord,
      subSubLord,
      coreValue,
      finalValue: Number((coreValue * houseWeight).toFixed(2)),
      state,
    } satisfies GodViewMovingKPMatrixRow;
  });
  const net = Number(rows.reduce((sum, row) => sum + row.finalValue, 0).toFixed(2));
  const ascendantStrength = Number(rows.reduce((sum, row) => sum + Math.max(row.finalValue, 0), 0).toFixed(2));
  const descendantStrength = Number(rows.reduce((sum, row) => sum + Math.max(-row.finalValue, 0), 0).toFixed(2));
  const supportContribution = Number(rows.filter((row) => row.houseRole === "SUPPORT").reduce((sum, row) => sum + row.finalValue, 0).toFixed(2));
  const winner = net > noCallThreshold ? "A" : net < -noCallThreshold ? "B" : "TIE";
  return {
    status: "experimental-read-only",
    coordinateFrame: "fixed-zodiac-wheel",
    input,
    activeFixedKPWinner: activePrediction.kpStellar.winner,
    activeCombinedWinner: activePrediction.combined.winner,
    rules: { primaryHouseWeight, supportHouseWeight, noCallThreshold, starLordIsAuditableOnly: true },
    rows,
    totals: { ascendantStrength, descendantStrength, supportContribution, net, winner, noCall: winner === "TIE" },
  };
}

/**
 * Full read-only KP family-house audit. It expands every permanent cusp into
 * occupation, ownership, cusp lord, moving anchor-chain, node-dispositor, and
 * Sub–Sub confirmation evidence without adding a new score or public verdict.
 */
export function runGodViewFullKPFamilyExperiment(input: GameInput): GodViewFullKPFamilyExperiment {
  const activePrediction = generateFixedJ2000KPPrediction(input);
  const rows = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, "god", 0);
    const fixed = kpSubSubDetailsFromCanonicalLongitude(cuspLongitude, new Date("2000-01-01T12:00:00Z"), false);
    const cuspSign = signForLongitude(cuspLongitude);
    const signLord = FIXED_SIGN_RULERS[cuspSign]!;
    const anchor = activePrediction.planets.find((planet) => planet.planet === fixed.subLord) ?? activePrediction.planets[0]!;
    const moving = kpSubSubDetailsFromCanonicalLongitude(anchor.fixedJ2000EclipticLongitude, input.startTime, false);
    const movingStar = resolveFullKPFamilyLord(moving.starLord, activePrediction.planets);
    const movingSub = resolveFullKPFamilyLord(moving.subLord, activePrediction.planets);
    const movingSubSub = resolveFullKPFamilyLord(moving.subSubLord, activePrediction.planets);
    return {
      house,
      cuspLongitude,
      cuspSign,
      fixedCusp: { signLord, starLord: fixed.starLord, subLord: fixed.subLord, subSubLord: fixed.subSubLord },
      cuspSignLord: resolveFullKPFamilyLord(signLord, activePrediction.planets),
      cuspStarLord: resolveFullKPFamilyLord(fixed.starLord, activePrediction.planets),
      cuspSubLord: resolveFullKPFamilyLord(fixed.subLord, activePrediction.planets),
      cuspSubSubLord: resolveFullKPFamilyLord(fixed.subSubLord, activePrediction.planets),
      movingAnchor: {
        planet: anchor.planet,
        longitude: anchor.fixedJ2000EclipticLongitude,
        house: anchor.house,
        nakshatra: moving.nakshatra,
        starLord: movingStar,
        subLord: movingSub,
        subSubLord: movingSubSub,
      },
      cuspConnection: {
        starLordMatches: moving.starLord === fixed.starLord,
        subLordMatches: moving.subLord === fixed.subLord,
        subSubLordMatches: moving.subSubLord === fixed.subSubLord,
        movingSubSignifiesCusp: movingSub.significations.includes(house),
        movingSubSubSignifiesCusp: movingSubSub.significations.includes(house),
      },
    } satisfies GodViewFullKPFamilyRow;
  });
  return {
    status: "experimental-read-only",
    coordinateFrame: "fixed-zodiac-wheel",
    input,
    activeFixedKPWinner: activePrediction.kpStellar.winner,
    activeCombinedWinner: activePrediction.combined.winner,
    method: "occupation-ownership-star-sub-cusp-subsub",
    rows,
  };
}

function fixedFamilyForHouse(house: number): "A" | "B" | "SUPPORT" {
  if (ASCENDANT_CLUSTER.includes(house as never)) return "A";
  if (DESCENDANT_CLUSTER.includes(house as never)) return "B";
  return "SUPPORT";
}

function scoreFullFamilyEvidence(label: string, evidence: KPFullFamilyEvidence, baseWeight: number, supportHouseIncrement: number): KPFamilyScoreContribution {
  const supportContribution = evidence.target === "NEUTRAL" ? 0 : evidence.supportHouses.length * supportHouseIncrement;
  const magnitude = evidence.target === "NEUTRAL" ? 0 : baseWeight + supportContribution;
  return {
    label,
    lord: evidence.lord,
    target: evidence.target,
    baseWeight,
    supportContribution,
    total: evidence.target === "A" ? magnitude : evidence.target === "B" ? -magnitude : 0,
  };
}

function scoreCuspConnection(label: string, applies: boolean, target: KPFullFamilyEvidence["target"], baseWeight: number, cuspFamily: "A" | "B" | "SUPPORT"): KPFamilyScoreContribution {
  const multiplier = cuspFamily === "SUPPORT" ? 0.35 : 1;
  const directedTarget = applies ? target : "NEUTRAL";
  const magnitude = directedTarget === "NEUTRAL" ? 0 : baseWeight * multiplier;
  return {
    label,
    lord: "cusp connection",
    target: directedTarget,
    baseWeight: baseWeight * multiplier,
    supportContribution: 0,
    total: directedTarget === "A" ? magnitude : directedTarget === "B" ? -magnitude : 0,
  };
}

/** Quantifies the full disclosed family evidence per fixed cusp without creating a public verdict. */
export function runGodViewPerCuspFamilyScoreExperiment(input: GameInput): GodViewPerCuspFamilyScoreExperiment {
  const family = runGodViewFullKPFamilyExperiment(input);
  const sourceWeights = {
    "Fixed Sign Lord": 0.5,
    "Fixed Cusp Star-Lord": 0.75,
    "Fixed Cusp Sub-Lord": 1.25,
    "Fixed Cusp Sub–Sub-Lord": 0.75,
    "Moving Star-Lord": 1,
    "Moving Sub-Lord": 2,
    "Moving Sub–Sub-Lord": 1.25,
  };
  const connectionBonuses = {
    "Star match": 0.25,
    "Sub match": 0.5,
    "Sub–Sub match": 0.75,
    "Moving Sub signifies cusp": 0.5,
    "Moving Sub–Sub signifies cusp": 0.75,
  };
  const supportHouseIncrement = 0.35;
  const noCallThreshold = 1;
  const rows = family.rows.map((row) => {
    const cuspFamily = fixedFamilyForHouse(row.house);
    const sourceContributions = [
      scoreFullFamilyEvidence("Fixed Sign Lord", row.cuspSignLord, sourceWeights["Fixed Sign Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Fixed Cusp Star-Lord", row.cuspStarLord, sourceWeights["Fixed Cusp Star-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Fixed Cusp Sub-Lord", row.cuspSubLord, sourceWeights["Fixed Cusp Sub-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Fixed Cusp Sub–Sub-Lord", row.cuspSubSubLord, sourceWeights["Fixed Cusp Sub–Sub-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Moving Star-Lord", row.movingAnchor.starLord, sourceWeights["Moving Star-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Moving Sub-Lord", row.movingAnchor.subLord, sourceWeights["Moving Sub-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Moving Sub–Sub-Lord", row.movingAnchor.subSubLord, sourceWeights["Moving Sub–Sub-Lord"], supportHouseIncrement),
    ];
    const connectionContributions = [
      scoreCuspConnection("Star match", row.cuspConnection.starLordMatches, row.movingAnchor.starLord.target, connectionBonuses["Star match"], cuspFamily),
      scoreCuspConnection("Sub match", row.cuspConnection.subLordMatches, row.movingAnchor.subLord.target, connectionBonuses["Sub match"], cuspFamily),
      scoreCuspConnection("Sub–Sub match", row.cuspConnection.subSubLordMatches, row.movingAnchor.subSubLord.target, connectionBonuses["Sub–Sub match"], cuspFamily),
      scoreCuspConnection("Moving Sub signifies cusp", row.cuspConnection.movingSubSignifiesCusp, row.movingAnchor.subLord.target, connectionBonuses["Moving Sub signifies cusp"], cuspFamily),
      scoreCuspConnection("Moving Sub–Sub signifies cusp", row.cuspConnection.movingSubSubSignifiesCusp, row.movingAnchor.subSubLord.target, connectionBonuses["Moving Sub–Sub signifies cusp"], cuspFamily),
    ];
    const sourceSubtotal = sourceContributions.reduce((total, contribution) => total + contribution.total, 0);
    const connectionSubtotal = connectionContributions.reduce((total, contribution) => total + contribution.total, 0);
    return { house: row.house, cuspSign: row.cuspSign, cuspFamily, sourceContributions, connectionContributions, sourceSubtotal, connectionSubtotal, total: sourceSubtotal + connectionSubtotal };
  });
  const net = rows.reduce((total, row) => total + row.total, 0);
  const ascendantStrength = rows.reduce((total, row) => total + Math.max(row.total, 0), 0);
  const descendantStrength = rows.reduce((total, row) => total + Math.max(-row.total, 0), 0);
  const supportContribution = rows.filter((row) => row.cuspFamily === "SUPPORT").reduce((total, row) => total + row.total, 0);
  const winner = net >= noCallThreshold ? "A" : net <= -noCallThreshold ? "B" : "TIE";
  return {
    status: "experimental-read-only",
    coordinateFrame: "fixed-zodiac-wheel",
    input,
    activeFixedKPWinner: family.activeFixedKPWinner,
    activeCombinedWinner: family.activeCombinedWinner,
    rules: { sourceWeights, supportHouseIncrement, connectionBonuses, noCallThreshold },
    rows,
    totals: { ascendantStrength, descendantStrength, supportContribution, net, winner, noCall: winner === "TIE" },
  };
}

/** Keeps each fixed cusp visible while counting current moving evidence once per anchor planet. */
export function runGodViewDeduplicatedAnchorScoreExperiment(input: GameInput): GodViewDeduplicatedAnchorScoreExperiment {
  const family = runGodViewFullKPFamilyExperiment(input);
  const base = runGodViewPerCuspFamilyScoreExperiment(input);
  const { sourceWeights, supportHouseIncrement, connectionBonuses, noCallThreshold } = base.rules;
  const fixedRows = family.rows.map((row) => {
    const fixedContributions = [
      scoreFullFamilyEvidence("Fixed Sign Lord", row.cuspSignLord, sourceWeights["Fixed Sign Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Fixed Cusp Star-Lord", row.cuspStarLord, sourceWeights["Fixed Cusp Star-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Fixed Cusp Sub-Lord", row.cuspSubLord, sourceWeights["Fixed Cusp Sub-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Fixed Cusp Sub–Sub-Lord", row.cuspSubSubLord, sourceWeights["Fixed Cusp Sub–Sub-Lord"], supportHouseIncrement),
    ];
    return { house: row.house, cuspSign: row.cuspSign, cuspFamily: fixedFamilyForHouse(row.house), fixedContributions, total: fixedContributions.reduce((total, entry) => total + entry.total, 0) };
  });
  const grouped = new Map<string, GodViewFullKPFamilyRow[]>();
  for (const row of family.rows) grouped.set(row.movingAnchor.planet, [...(grouped.get(row.movingAnchor.planet) ?? []), row]);
  const anchorGroups = Array.from(grouped.entries()).map(([anchor, members]) => {
    const representative = members[0];
    const movingContributions = [
      scoreFullFamilyEvidence("Moving Star-Lord", representative.movingAnchor.starLord, sourceWeights["Moving Star-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Moving Sub-Lord", representative.movingAnchor.subLord, sourceWeights["Moving Sub-Lord"], supportHouseIncrement),
      scoreFullFamilyEvidence("Moving Sub–Sub-Lord", representative.movingAnchor.subSubLord, sourceWeights["Moving Sub–Sub-Lord"], supportHouseIncrement),
    ];
    const candidates: KPFamilyScoreContribution[] = members.flatMap((row: GodViewFullKPFamilyRow) => {
      const cuspFamily = fixedFamilyForHouse(row.house);
      return [
        scoreCuspConnection("Star match", row.cuspConnection.starLordMatches, row.movingAnchor.starLord.target, connectionBonuses["Star match"], cuspFamily),
        scoreCuspConnection("Sub match", row.cuspConnection.subLordMatches, row.movingAnchor.subLord.target, connectionBonuses["Sub match"], cuspFamily),
        scoreCuspConnection("Sub–Sub match", row.cuspConnection.subSubLordMatches, row.movingAnchor.subSubLord.target, connectionBonuses["Sub–Sub match"], cuspFamily),
        scoreCuspConnection("Moving Sub signifies cusp", row.cuspConnection.movingSubSignifiesCusp, row.movingAnchor.subLord.target, connectionBonuses["Moving Sub signifies cusp"], cuspFamily),
        scoreCuspConnection("Moving Sub–Sub signifies cusp", row.cuspConnection.movingSubSubSignifiesCusp, row.movingAnchor.subSubLord.target, connectionBonuses["Moving Sub–Sub signifies cusp"], cuspFamily),
      ];
    });
    const selectedConnections = ["Star match", "Sub match", "Sub–Sub match", "Moving Sub signifies cusp", "Moving Sub–Sub signifies cusp"].flatMap((label) => {
      const matches = candidates.filter((entry: KPFamilyScoreContribution) => entry.label === label && entry.total !== 0);
      return matches.length ? [matches.reduce((best: KPFamilyScoreContribution, entry: KPFamilyScoreContribution) => Math.abs(entry.total) > Math.abs(best.total) ? entry : best)] : [];
    });
    const total = [...movingContributions, ...selectedConnections].reduce((sum, entry) => sum + entry.total, 0);
    return { anchor, memberHouses: members.map((row: GodViewFullKPFamilyRow) => row.house), movingChain: { starLord: representative.movingAnchor.starLord.lord, subLord: representative.movingAnchor.subLord.lord, subSubLord: representative.movingAnchor.subSubLord.lord }, movingContributions, selectedConnections, total };
  });
  const fixedSubtotal = fixedRows.reduce((total, row) => total + row.total, 0);
  const movingAnchorSubtotal = anchorGroups.reduce((total, group) => total + group.total, 0);
  const net = fixedSubtotal + movingAnchorSubtotal;
  const winner = net >= noCallThreshold ? "A" : net <= -noCallThreshold ? "B" : "TIE";
  return { status: "experimental-read-only", coordinateFrame: "fixed-zodiac-wheel", input, activeFixedKPWinner: family.activeFixedKPWinner, activeCombinedWinner: family.activeCombinedWinner, rules: { sourceWeights, supportHouseIncrement, connectionBonuses, noCallThreshold, movingAnchorPolicy: "count-once-per-planet" }, fixedRows, anchorGroups, totals: { fixedSubtotal, movingAnchorSubtotal, net, winner, noCall: winner === "TIE" } };
}

/**
 * Configurable multi-level inspection path. The existing Territorial result,
 * active Sub-Lord KP density, and active combined prediction are preserved;
 * this function only exposes a proposed close-matchup resolution for audit.
 */
export function runFixedJ2000KPTerritorialResonanceExperiment(
  input: GameInput,
  configOverride?: Partial<KPResonanceConfig>,
): KPTerritorialResonanceExperiment {
  const config = resolveKPResonanceConfig(configOverride);
  const activePrediction = generateFixedJ2000KPPrediction(input);
  const ascendant = resonanceAuditForSide(activePrediction.planets, "A", config);
  const descendant = resonanceAuditForSide(activePrediction.planets, "B", config);
  const territorialMargin = Number(Math.abs(activePrediction.territorial.scoreA - activePrediction.territorial.scoreB).toFixed(2));
  const classification = territorialMargin <= config.closeTerritorialMargin ? "CLOSE_TERRITORIAL_MATCHUP" : "CLEAR_TERRITORIAL_ADVANTAGE";
  const kpWinner = layerWinner(ascendant.finalKPWinFit, descendant.finalKPWinFit);
  const overallConflict = activePrediction.territorial.winner !== "TIE" && kpWinner !== "TIE" && activePrediction.territorial.winner !== kpWinner;
  const proposedWinner = !config.enabled
    ? activePrediction.combined.winner
    : classification === "CLOSE_TERRITORIAL_MATCHUP"
      ? kpWinner
      : activePrediction.territorial.winner;
  return {
    status: "experimental-read-only",
    coordinateFrame: "fixed-zodiac-wheel",
    config,
    territorial: {
      scoreA: activePrediction.territorial.scoreA,
      scoreB: activePrediction.territorial.scoreB,
      margin: territorialMargin,
      classification,
      winner: activePrediction.territorial.winner,
      evidence: activePrediction.territorial.evidence!,
    },
    ascendant: { team: input.teamA, ...ascendant },
    descendant: { team: input.teamB, ...descendant },
    resolution: {
      kpWinner,
      proposedWinner,
      overallConflict,
      activeCombinedWinner: activePrediction.combined.winner,
      note: config.enabled
        ? "Experimental only: Sub–Sub-Lord modifies the primary Sub-Lord through configurable resonance and proposes a result only for close Territorial matchups. Active prediction weights are unchanged."
        : "Disabled configuration: the proposed result is the unchanged active combined prediction; all resonance audit fields remain inspectable.",
    },
  };
}

/**
 * Observer-local comparison path. It intentionally uses a moving Ascendant,
 * local event coordinates, and ecliptic-of-date positions; it therefore remains
 * separate from the permanent Fixed J2000 production coordinate frame.
 */
export function runAscendantHouseResonanceSimulation(input: GameInput, configOverride?: Partial<KPResonanceConfig>): AscendantHouseResonanceSimulation {
  const config = resolveKPResonanceConfig(configOverride);
  const source = generatePredictionForModel(input, "azimuth");
  const ascendantLongitude = source.ascendantLongitude;
  const localPlanets = source.planets.map((planet) => {
    const localPosition = locateInHouse(planet.backgroundWheelLongitude, "agent", ascendantLongitude);
    const signPosition = fixedEclipticHouseFromLongitude(planet.backgroundWheelLongitude);
    return {
      ...planet,
      tropicalLongitude: planet.ofDateEclipticLongitude,
      house: localPosition.house,
      degreeInHouse: localPosition.degreeInHouse,
      sign: signPosition.sign,
      degreeInSign: signPosition.degreeInHouse,
    };
  });
  const territorial = territorialVerdict(localPlanets, ascendantLongitude, (longitude) => locateInHouse(longitude, "agent", ascendantLongitude).house);
  const ascendant = resonanceAuditForSide(localPlanets, "A", config, ascendantLongitude, true);
  const descendant = resonanceAuditForSide(localPlanets, "B", config, ascendantLongitude, true);
  const margin = Number(Math.abs(territorial.scoreA - territorial.scoreB).toFixed(2));
  const classification = margin <= config.closeTerritorialMargin ? "CLOSE_TERRITORIAL_MATCHUP" : "CLEAR_TERRITORIAL_ADVANTAGE";
  const kpWinner = layerWinner(ascendant.finalKPWinFit, descendant.finalKPWinFit);
  const overallConflict = territorial.winner !== "TIE" && kpWinner !== "TIE" && territorial.winner !== kpWinner;
  const proposedWinner = !config.enabled ? territorial.winner : classification === "CLOSE_TERRITORIAL_MATCHUP" ? kpWinner : territorial.winner;
  return {
    status: "experimental-read-only",
    coordinateFrame: "observer-local-ascendant-equal-house",
    ascendantLongitude,
    config,
    territorial: { scoreA: territorial.scoreA, scoreB: territorial.scoreB, margin, classification, winner: territorial.winner, evidence: territorial.evidence! },
    ascendant: { team: input.teamA, ...ascendant },
    descendant: { team: input.teamB, ...descendant },
    resolution: {
      kpWinner,
      proposedWinner,
      overallConflict,
      activeCombinedWinner: source.combined.winner,
      note: "Observer-local simulation only: local time, longitude, latitude, moving Ascendant, and ecliptic-of-date positions are used. It does not modify the Fixed J2000 production model.",
    },
  };
}

/**
 * Parallel read-only event-chart audit. Both frames use the same seven
 * Territorial layers and the same KP Sub-Lord/Sub–Sub-Lord resonance chain;
 * only the coordinate frame and house rule differ. It exposes both frame
 * resolutions without adding a cross-frame weight or a public call.
 */
export function runAgentGodFullLayerExperiment(
  input: GameInput,
  configOverride?: Partial<KPResonanceConfig>,
): AgentGodFullLayerExperiment {
  const config = resolveKPResonanceConfig({ ...configOverride, enabled: true });
  const godSource = runFixedJ2000KPTerritorialResonanceExperiment(input, config);
  const agentSource = runAscendantHouseResonanceSimulation(input, config);
  const buildFrame = (
    source: KPTerritorialResonanceExperiment | AscendantHouseResonanceSimulation,
    houseRule: FullLayerFrameAudit["houseRule"],
  ): FullLayerFrameAudit => ({
    coordinateFrame: source.coordinateFrame,
    houseRule,
    ascendantLongitude: "ascendantLongitude" in source ? source.ascendantLongitude : undefined,
    territorial: source.territorial,
    kp: {
      ascendant: source.ascendant,
      descendant: source.descendant,
      resolution: source.resolution,
    },
  });
  return {
    status: "experimental-read-only",
    input,
    config,
    territorialLayers: [
      "Cluster territory & house-lord placement",
      "Nakshatra influence",
      "Essential dignity",
      "Chaldean Decans",
      "Planetary war",
      "Arabic Lots",
      "Nine-planet influence",
    ],
    god: buildFrame(godSource, "permanent-aries-zero-equal-house"),
    agent: buildFrame(agentSource, "local-moving-ascendant-equal-house"),
    boundary: "Read-only evidence experiment: the two frames retain their separate Territorial and KP resolutions. No cross-frame score, winner, live prediction, model weight, or validation record is changed.",
  };
}

export const SAMPLE_BACKTEST = [
  { teamA: "Blue Jays", teamB: "Red Sox", actual: "Blue Jays", city: "Toronto", latitude: 43.65, longitude: -79.38, date: "2026-08-10", time: "23:07" },
  { teamA: "Yankees", teamB: "White Sox", actual: "Yankees", city: "New York", latitude: 40.71, longitude: -74, date: "2026-08-10", time: "22:10" },
  { teamA: "Orioles", teamB: "Angels", actual: "Angels", city: "Baltimore", latitude: 39.29, longitude: -76.61, date: "2026-08-10", time: "22:35" },
  { teamA: "Cubs", teamB: "Giants", actual: "Cubs", city: "Chicago", latitude: 41.87, longitude: -87.62, date: "2026-08-10", time: "23:40" },
  { teamA: "Braves", teamB: "Mets", actual: "Braves", city: "Atlanta", latitude: 33.74, longitude: -84.38, date: "2026-08-10", time: "01:10" },
  { teamA: "CWS", teamB: "Astros", actual: "Astros", city: "Chicago", latitude: 41.87, longitude: -87.62, date: "2026-08-10", time: "01:20" },
  { teamA: "Rangers", teamB: "Mariners", actual: "Mariners", city: "Arlington", latitude: 32.73, longitude: -97.1, date: "2026-08-10", time: "02:10" },
  { teamA: "Diamondbacks", teamB: "Padres", actual: "Padres", city: "Phoenix", latitude: 33.44, longitude: -112.07, date: "2026-08-10", time: "02:40" },
  { teamA: "Athletics", teamB: "Dodgers", actual: "Dodgers", city: "San Francisco", latitude: 37.77, longitude: -122.41, date: "2026-08-10", time: "02:45" },
  { teamA: "Phillies", teamB: "Marlins", actual: "Phillies", city: "Philadelphia", latitude: 39.95, longitude: -75.16, date: "2026-08-11", time: "23:05" },
  { teamA: "Red Sox", teamB: "Rays", actual: "Red Sox", city: "Boston", latitude: 42.36, longitude: -71.05, date: "2026-08-11", time: "23:10" },
  { teamA: "Nationals", teamB: "Cardinals", actual: "Cardinals", city: "Washington", latitude: 38.89, longitude: -77.03, date: "2026-08-11", time: "22:35" },
  { teamA: "Brewers", teamB: "Reds", actual: "Brewers", city: "Milwaukee", latitude: 43.03, longitude: -87.91, date: "2026-08-11", time: "23:40" },
  { teamA: "Astros", teamB: "Guardians", actual: "Astros", city: "Houston", latitude: 29.76, longitude: -95.36, date: "2026-08-11", time: "00:10" },
  { teamA: "Royals", teamB: "Tigers", actual: "Royals", city: "Kansas City", latitude: 39.09, longitude: -94.57, date: "2026-08-11", time: "01:05" },
  { teamA: "Twins", teamB: "Pirates", actual: "Twins", city: "Minneapolis", latitude: 44.97, longitude: -93.26, date: "2026-08-11", time: "01:10" },
  { teamA: "Rockies", teamB: "Mets", actual: "Mets", city: "Denver", latitude: 39.73, longitude: -104.99, date: "2026-08-11", time: "02:10" },
  { teamA: "Padres", teamB: "Nationals", actual: "Padres", city: "San Diego", latitude: 32.71, longitude: -117.16, date: "2026-08-11", time: "02:20" },
  { teamA: "Angels", teamB: "Yankees", actual: "Yankees", city: "Los Angeles", latitude: 34.05, longitude: -118.24, date: "2026-08-11", time: "02:40" },
  { teamA: "Mariners", teamB: "Orioles", actual: "Mariners", city: "Seattle", latitude: 47.6, longitude: -122.33, date: "2026-08-11", time: "02:45" },
  { teamA: "Mets", teamB: "Rockies", actual: "Mets", city: "New York", latitude: 40.71, longitude: -74, date: "2026-08-11", time: "17:35" },
  { teamA: "Marlins", teamB: "Phillies", actual: "Phillies", city: "Miami", latitude: 25.76, longitude: -80.19, date: "2026-08-11", time: "18:10" },
  { teamA: "Reds", teamB: "Brewers", actual: "Brewers", city: "Cincinnati", latitude: 39.1, longitude: -84.51, date: "2026-08-11", time: "19:05" },
  { teamA: "Guardians", teamB: "Astros", actual: "Astros", city: "Cleveland", latitude: 41.49, longitude: -81.69, date: "2026-08-11", time: "19:10" },
  { teamA: "Cardinals", teamB: "Cubs", actual: "Cubs", city: "St. Louis", latitude: 38.62, longitude: -90.19, date: "2026-08-11", time: "19:20" },
] as const;

function runBacktestForModel(domeModel: DomeModel) {
  const games = SAMPLE_BACKTEST.map((game) => {
    const input = {
      teamA: game.teamA,
      teamB: game.teamB,
      location: game.city,
      coordinates: { latitude: game.latitude, longitude: game.longitude },
      gameType: "MLB",
      startTime: new Date(`${game.date}T${game.time}:00.000Z`),
    } as const;
    const prediction = domeModel === "polaris-fixed-ra"
      ? generatePolarisFixedRAPrediction(input)
      : domeModel === "fixed-ecliptic"
      ? generateFixedEclipticPrediction(input)
      : domeModel === "unified-ephemeris"
        ? generateUnifiedEphemerisPrediction(input)
        : domeModel === "fixed-zodiac-wheel"
          ? generateFixedJ2000KPPrediction(input)
        : generateAzimuthLegacyPrediction(input);
    const pick = (winner: "A" | "B" | "TIE") => winner === "A" ? game.teamA : winner === "B" ? game.teamB : "Tie";
    const territorial = pick(prediction.territorial.winner);
    const kp = pick(prediction.kpStellar.winner);
    const combined = pick(prediction.combined.winner);
    return {
      matchup: `${game.teamA} vs. ${game.teamB}`,
      date: game.date,
      actual: game.actual,
      territorial,
      kp,
      combined,
      outcome: combined === game.actual ? "Hit" : "Miss",
      territorialLayers: prediction.territorial.evidence?.layers ?? [],
    };
  });
  const rate = (key: "territorial" | "kp" | "combined") => Number((games.filter((game) => game[key] === game.actual).length / games.length * 100).toFixed(1));
  const territorialLayerAverages = games[0]?.territorialLayers.map((layer, index) => ({
    name: layer.name,
    scoreA: Number((games.reduce((sum, game) => sum + (game.territorialLayers[index]?.scoreA ?? 0), 0) / games.length).toFixed(2)),
    scoreB: Number((games.reduce((sum, game) => sum + (game.territorialLayers[index]?.scoreB ?? 0), 0) / games.length).toFixed(2)),
    detail: layer.detail,
  })) ?? [];
  return {
    domeModel,
    metrics: { territorial: rate("territorial"), kpStellar: rate("kp"), combined: rate("combined"), sampleSize: games.length },
    games,
    territorialLayerAverages,
    methodology: "Each row is recalculated from the verified Aug. 10–11, 2026 MLB slate. Territorial Control includes the restored house-lord cluster, Nakshatra influence, dignity, planetary-war, Arabic-Lot, and nine-planet influence layers. The combined score remains the arithmetic mean of Territorial Control and KP Stellar; no layer is a multiplier or gate.",
  };
}

/** Active verified report: Polaris-centered fixed J2000 RA Pure Clock. */
export function runVerifiedBacktest() {
  return runBacktestForModel("polaris-fixed-ra");
}

/** Preserved comparison report: former topocentric azimuth baseline. */
export function runAzimuthLegacyBacktest() {
  return runBacktestForModel("azimuth");
}

/** Experimental report: the same verified games, but direct ephemeris Fixed Ecliptic placement. */
export function runFixedEclipticBacktest() {
  return runBacktestForModel("fixed-ecliptic");
}

/** Same slate, but raw ephemeris longitude feeds both literal dome and KP lookup with no shift. */
export function runUnifiedEphemerisBacktest() {
  return runBacktestForModel("unified-ephemeris");
}

/** Same verified slate through the fixed zero-tilt dome KP path. */
export function runFixedJ2000KPBacktest() {
  return runBacktestForModel("fixed-zodiac-wheel");
}

export function runDomeModelComparisonBacktest() {
  const polarisFixedRA = runVerifiedBacktest();
  const azimuth = runAzimuthLegacyBacktest();
  const fixedEcliptic = runFixedEclipticBacktest();
  const unifiedEphemeris = runUnifiedEphemerisBacktest();
  const fixedJ2000KP = runFixedJ2000KPBacktest();
  return {
    polarisFixedRA,
    azimuth,
    fixedEcliptic,
    unifiedEphemeris,
    fixedJ2000KP,
    legacyAzimuthDifferences: {
      territorial: Number((azimuth.metrics.territorial - polarisFixedRA.metrics.territorial).toFixed(1)),
      kpStellar: Number((azimuth.metrics.kpStellar - polarisFixedRA.metrics.kpStellar).toFixed(1)),
      combined: Number((azimuth.metrics.combined - polarisFixedRA.metrics.combined).toFixed(1)),
    },
    differences: {
      territorial: Number((fixedEcliptic.metrics.territorial - polarisFixedRA.metrics.territorial).toFixed(1)),
      kpStellar: Number((fixedEcliptic.metrics.kpStellar - polarisFixedRA.metrics.kpStellar).toFixed(1)),
      combined: Number((fixedEcliptic.metrics.combined - polarisFixedRA.metrics.combined).toFixed(1)),
    },
    unifiedDifferences: {
      territorial: Number((unifiedEphemeris.metrics.territorial - polarisFixedRA.metrics.territorial).toFixed(1)),
      kpStellar: Number((unifiedEphemeris.metrics.kpStellar - polarisFixedRA.metrics.kpStellar).toFixed(1)),
      combined: Number((unifiedEphemeris.metrics.combined - polarisFixedRA.metrics.combined).toFixed(1)),
    },
    fixedJ2000KpDifferences: {
      territorial: Number((fixedJ2000KP.metrics.territorial - polarisFixedRA.metrics.territorial).toFixed(1)),
      kpStellar: Number((fixedJ2000KP.metrics.kpStellar - polarisFixedRA.metrics.kpStellar).toFixed(1)),
      combined: Number((fixedJ2000KP.metrics.combined - polarisFixedRA.metrics.combined).toFixed(1)),
    },
  };
}

```

## FILE: server/engine/experimentalLayers.ts

Git blob SHA: `71f0c71f53e59b545c84a3f2cf918817954d2af2`

```typescript
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

```

## FILE: server/engine/simulationAdapter.ts

Git blob SHA: `1b61f70de5c3f866e7b110ddda695376b25b6f64`

```typescript
import { synthesizeFramePredictions } from "./crossFrameSynthesis";
import {
  generateFixedJ2000KPPrediction,
  generateFixedJ2000PlanetReadings,
  generatePredictionForModel,
  fixedEclipticHouseFromLongitude,
  kpDetailsFromCanonicalLongitude,
  runFullPackageDualFrameChallenger,
  buildCelestialGeometryEvidence,
  type AgentViewRotationMode,
  type GameInput,
  equalHouseZonePlacement,
  NAKSHATRAS,
  NAKSHATRA_ARC_DEGREES,
} from "./index";
import { calculateExperimentalLayers } from "./experimentalLayers";
import { houseCusp, locateInHouse } from "./houseFrameFoundation";
import { buildMethodChartSnapshot, runRegisteredMethodsFromSnapshot } from "./methodRegistry";
import { auditNeutralMethod, type NeutralMethodDiagnostic } from "./neutralMethodAudit";

export type SimulationEventInput = {
  id?: string;
  teamA: string;
  teamB: string;
  favoredTeam?: string;
  underdogTeam?: string;
  homeTeam?: string;
  awayTeam?: string;
  roleAssignmentSource?: "market-odds" | "expert-consensus" | "manual" | "legacy-side-order";
  sport: GameInput["gameType"];
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  actualWinner?: "A" | "B" | "TIE";
  agentViewRotation?: AgentViewRotationMode;
  agentViewModel?: "astronomical" | "fixed-earth-dawn-anchored";
  sunriseTime?: string;
  sunriseSource?: string;
};

type Winner = "A" | "B" | "TIE";

type LayerResult = {
  name: string;
  scoreA: number;
  scoreB: number;
  winner: Winner;
  verdict: "hit" | "miss" | "tie" | "unverified";
  detail: string;
  source: string;
  neutralDiagnostic: NeutralMethodDiagnostic;
  calculation?: { formula: string; inputs: string[]; steps: string[] };
};

function winnerFor(scoreA: number, scoreB: number): Winner {
  if (scoreA === scoreB) return "TIE";
  return scoreA > scoreB ? "A" : "B";
}

function verdictFor(winner: Winner, actualWinner?: Winner): LayerResult["verdict"] {
  if (!actualWinner) return "unverified";
  if (winner === "TIE" || actualWinner === "TIE") return winner === actualWinner ? "tie" : "miss";
  return winner === actualWinner ? "hit" : "miss";
}

function layerFromEvidence(
  layer: { name: string; scoreA: number; scoreB: number; detail: string; source?: string; calculation?: { formula: string; inputs: string[]; steps: string[] } },
  actualWinner?: Winner,
): LayerResult {
  const winner = winnerFor(layer.scoreA, layer.scoreB);
  const result = {
    name: layer.name,
    scoreA: Number(layer.scoreA.toFixed(3)),
    scoreB: Number(layer.scoreB.toFixed(3)),
    winner,
    verdict: verdictFor(winner, actualWinner),
    detail: layer.detail,
    source: layer.source ?? "firmament-engine",
    calculation: layer.calculation ? {
      ...layer.calculation,
      steps: [...layer.calculation.steps, `Final method output: A ${layer.scoreA.toFixed(3)} vs B ${layer.scoreB.toFixed(3)} → ${winner === "A" ? "Side A" : winner === "B" ? "Side B" : "Tie"}.`, actualWinner ? `Hit/miss test: ${winner === actualWinner ? "HIT" : "MISS"} because method call ${winner} ${winner === actualWinner ? "matches" : "does not match"} verified result ${actualWinner}.` : "Hit/miss test: UNVERIFIED because no actual winner was supplied."],
    } : undefined,
  };
  return { ...result, neutralDiagnostic: auditNeutralMethod(result) };
}

function houseOverlays(planet: { manzil: { startLongitude: number; endLongitude: number }; nakshatra: string }, ascendantLongitude: number) {
  const nakshatraIndex = NAKSHATRAS.indexOf(planet.nakshatra as typeof NAKSHATRAS[number]);
  return {
    manzil: equalHouseZonePlacement(planet.manzil.startLongitude, planet.manzil.endLongitude, ascendantLongitude),
    nakshatra: nakshatraIndex >= 0 ? equalHouseZonePlacement(nakshatraIndex * NAKSHATRA_ARC_DEGREES, (nakshatraIndex + 1) * NAKSHATRA_ARC_DEGREES, ascendantLongitude) : null,
  };
}

function chartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>) {
  return {
    domeModel: prediction.domeModel,
    venue: prediction.venue,
    ascendantLongitude: prediction.ascendantLongitude,
    localSiderealTime: prediction.localSiderealTime,
    houses: prediction.houses.map((house) => ({
      house: house.house,
      cluster: house.cluster,
      cuspLongitude: Number(house.cuspLongitude.toFixed(4)),
      sign: house.sign,
      starLord: house.starLord,
      subLord: house.subLord,
      subLordHouse: house.subLordHouse,
      subLordAllegiance: house.subLordAllegiance,
    })),
    planets: prediction.planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      backgroundWheelLongitude: Number(planet.backgroundWheelLongitude.toFixed(4)),
      house: planet.house,
      sign: planet.sign,
      degreeInHouse: Number(planet.degreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      manzil: planet.manzil,
      houseOverlays: houseOverlays(planet, prediction.ascendantLongitude),
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function fixedGodChartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>, startTime: Date) {
  const planets = generateFixedJ2000PlanetReadings(startTime);
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, "god", 0);
    const stellar = kpDetailsFromCanonicalLongitude(cuspLongitude, startTime, false);
    const subLordPlacement = planets.find((planet) => planet.planet === stellar.subLord);
    return {
      house,
      cluster: prediction.houses[index]?.cluster ?? "neutral",
      cuspLongitude,
      sign: signs[index],
      starLord: stellar.starLord,
      subLord: stellar.subLord,
      subLordHouse: subLordPlacement?.house ?? null,
      subLordAllegiance: prediction.houses[index]?.subLordAllegiance ?? "neutral",
    };
  });
  return {
    domeModel: "fixed-zodiac-wheel",
    venue: "permanent fixed background",
    ascendantLongitude: 0,
    localSiderealTime: 0,
    houses,
    planets: planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      backgroundWheelLongitude: Number(planet.backgroundWheelLongitude.toFixed(4)),
      house: planet.firmamentHouse,
      sign: planet.sign,
      degreeInHouse: Number(planet.firmamentDegreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      manzil: planet.manzil,
      houseOverlays: houseOverlays(planet, 0),
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function dawnAgentChartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>, ascendantLongitude: number, startTime: Date) {
  const planets = prediction.planets.map((planet) => {
    const local = locateInHouse(planet.backgroundWheelLongitude, "agent", ascendantLongitude);
    return { ...planet, house: local.house, degreeInHouse: local.degreeInHouse, sign: planet.sign };
  });
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, "agent", ascendantLongitude);
    const stellar = kpDetailsFromCanonicalLongitude(cuspLongitude, startTime, true);
    const subLordPlacement = planets.find((planet) => planet.planet === stellar.subLord);
    return {
      house,
      cluster: prediction.houses[index]?.cluster ?? "neutral",
      cuspLongitude,
      sign: fixedEclipticHouseFromLongitude(cuspLongitude).sign,
      starLord: stellar.starLord,
      subLord: stellar.subLord,
      subLordHouse: subLordPlacement?.house ?? null,
      subLordAllegiance: prediction.houses[index]?.subLordAllegiance ?? "neutral",
    };
  });
  return {
    domeModel: "fixed-earth-dawn-anchored",
    venue: prediction.venue,
    ascendantLongitude,
    localSiderealTime: prediction.localSiderealTime,
    houses,
    planets: planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      backgroundWheelLongitude: Number(planet.backgroundWheelLongitude.toFixed(4)),
      house: planet.house,
      sign: planet.sign,
      degreeInHouse: Number(planet.degreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      manzil: planet.manzil,
      houseOverlays: houseOverlays(planet, ascendantLongitude),
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function frameReport(
  frame: ReturnType<typeof runFullPackageDualFrameChallenger>["god"],
  actualWinner?: Winner,
) {
  const foundation = frame.foundation.layers.map((layer) => layerFromEvidence(layer, actualWinner));
  const added = frame.addedLayers.map((layer) => layerFromEvidence(layer, actualWinner));
  const allLayers = [...foundation, ...added];
  const ascendantHouses = [1, 2, 3, 6, 10, 11];
  const descendantHouses = [4, 5, 7, 8, 9, 12];
  // Explain each score without disguising a full-chart evidence appendix as scoring.
  const methodWalkthrough = allLayers.map((layer, index) => {
    const calculation = layer.calculation;
    const scoringSteps = (calculation?.steps ?? []).filter(line => !line.startsWith("FAMILY EVIDENCE (not additional score):") && !line.startsWith("Collective coverage:"));
    const familyInputs = (calculation?.inputs ?? []).filter(line => line.startsWith("FAMILY EVIDENCE (not additional score):"));
    const scoringInputs = (calculation?.inputs ?? []).filter(line => !line.startsWith("FAMILY EVIDENCE (not additional score):"));
    const scoreA = layer.scoreA, scoreB = layer.scoreB;
    const familyDifference = Number((scoreA - scoreB).toFixed(3));
    return {
      number: index + 1,
      method: layer.name,
      housesA: ascendantHouses,
      housesB: descendantHouses,
      appliedRule: calculation?.formula ?? "UNDOCUMENTED: method lacks a formal formula",
      scoringInputs,
      scoringSteps,
      familyEvidence: familyInputs,
      scoreA,
      scoreB,
      differenceAminusB: familyDifference,
      selectedSide: layer.winner,
      scoringProofStatus: !calculation?.formula || scoringSteps.length === 0 ? "INCOMPLETE_TRACE" : "FORMULA_AND_STEPS_RECORDED_NOT_INDEPENDENTLY_RECONCILED",
      arithmetic: `A ${scoreA.toFixed(3)} minus B ${scoreB.toFixed(3)} equals ${familyDifference.toFixed(3)}; method judgment ${layer.winner}`,
    };
  });
  const decisionTrace = [
    `Role assignment: Side A = Ascendant territory in H${ascendantHouses.join(", H")}; Side B = Descendant territory in H${descendantHouses.join(", H")}.`,
    `Frame rule: ${frame.houseRule}; coordinate frame: ${frame.coordinateFrame}; ascendant model: ${frame.ascendantModel}.`,
    ...allLayers.map((layer) => `${layer.name}: raw score A ${layer.scoreA.toFixed(3)} vs B ${layer.scoreB.toFixed(3)} → ${layer.winner === "A" ? "Side A / Ascendant" : layer.winner === "B" ? "Side B / Descendant" : "Tie"}. Recorded evidence: ${layer.detail}`),
    `Synthesis: foundation A ${frame.foundation.scoreA.toFixed(3)} + extensions = A ${frame.synthesis.scoreA.toFixed(3)}; foundation B ${frame.foundation.scoreB.toFixed(3)} + extensions = B ${frame.synthesis.scoreB.toFixed(3)}; margin ${frame.synthesis.margin.toFixed(3)} → ${frame.synthesis.winner === "A" ? "Side A / Ascendant" : frame.synthesis.winner === "B" ? "Side B / Descendant" : "Tie"}.`,
  ];
  return {
    name: frame.name,
    coordinateFrame: frame.coordinateFrame,
    houseRule: frame.houseRule,
    ascendantModel: frame.ascendantModel,
    sunriseSource: frame.sunriseSource ?? null,
    sunriseTime: frame.sunriseTime ?? null,
    ascendantLongitude: frame.ascendantLongitude,
    fullChartLedger: frame.fullChartLedger,
    synthesis: {
      ...frame.synthesis,
      verdict: verdictFor(frame.synthesis.winner, actualWinner),
    },
    foundation,
    added,
    allLayers,
    proof: {
      roleAssignment: {
        sideA: "Ascendant",
        sideB: "Descendant",
        ascendantHouses,
        descendantHouses,
      },
      scoreFormula: frame.synthesis.formula,
      methodWalkthrough,
      decisionTrace,
    },
    summary: {
      hits: allLayers.filter((layer) => layer.verdict === "hit").length,
      misses: allLayers.filter((layer) => layer.verdict === "miss").length,
      ties: allLayers.filter((layer) => layer.verdict === "tie").length,
      unverified: allLayers.filter((layer) => layer.verdict === "unverified").length,
    },
  };
}

export function runSimulationEvent(input: SimulationEventInput) {
  const startTime = new Date(input.startTime);
  if (Number.isNaN(startTime.getTime())) throw new Error("startTime must be a valid ISO date");
  const favoredTeam = input.favoredTeam ?? input.teamA;
  const underdogTeam = input.underdogTeam ?? input.teamB;
  const roleAssignmentSource = input.roleAssignmentSource ?? (input.favoredTeam && input.underdogTeam ? "manual" : "legacy-side-order");
  const gameInput: GameInput = {
    teamA: favoredTeam,
    teamB: underdogTeam,
    gameType: input.sport,
    location: input.location,
    startTime,
    ...(input.sunriseTime ? { sunriseTime: new Date(input.sunriseTime) } : {}),
    ...(input.sunriseSource ? { sunriseSource: input.sunriseSource } : {}),
    ...(input.agentViewModel ? { agentViewModel: input.agentViewModel } : {}),
    ...(input.latitude !== undefined && input.longitude !== undefined
      ? { coordinates: { latitude: input.latitude, longitude: input.longitude } }
      : {}),
  };

  const activePrediction = generateFixedJ2000KPPrediction(gameInput);
  const agentPrediction = generatePredictionForModel(gameInput, "azimuth");
  const dualFrame = runFullPackageDualFrameChallenger(gameInput, { agentViewRotation: input.agentViewRotation ?? "none", agentViewModel: input.agentViewModel ?? "astronomical" });
  const godExperimental = calculateExperimentalLayers(activePrediction, startTime);
  const agentExperimental = calculateExperimentalLayers(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, startTime);
  const godMethodSnapshot = buildMethodChartSnapshot(activePrediction, startTime, "god");
  const agentMethodSnapshot = buildMethodChartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, startTime, "agent", dualFrame.agent.ascendantLongitude);
  const godMethodResults = runRegisteredMethodsFromSnapshot(godMethodSnapshot);
  const agentMethodResults = runRegisteredMethodsFromSnapshot(agentMethodSnapshot);
  const celestialGeometry = buildCelestialGeometryEvidence(activePrediction.planets.map((planet) => ({ planet: planet.planet, longitude: planet.backgroundWheelLongitude, nakshatra: planet.nakshatra, manzil: planet.manzil })));
  const actualWinner = input.actualWinner;
  const baselineWinner = activePrediction.combined.winner as Winner;
  const baselineVerdict = verdictFor(baselineWinner, actualWinner);
  const predictiveSynthesis = synthesizeFramePredictions([...dualFrame.god.foundation.layers,...dualFrame.god.addedLayers], [...dualFrame.agent.foundation.layers,...dualFrame.agent.addedLayers], dualFrame.parity.valid);

  return {
    id: input.id ?? `${favoredTeam}-${underdogTeam}-${input.startTime}`,
    input: { ...input, teamA: favoredTeam, teamB: underdogTeam, favoredTeam, underdogTeam, roleAssignmentSource, startTime: startTime.toISOString() },
    evaluationFramework: {
      sideA: "Ascendant / favored to win",
      sideB: "Descendant / underdog",
      actualWinnerMeaning: "A means favored won; B means underdog won; TIE means no decisive result.",
      homeAwayIsMetadataOnly: true,
      roleAssignmentSource,
      primaryResearchEligible: roleAssignmentSource !== "legacy-side-order",
    },
    engine: {
      source: "firmament-engine",
      calculationPath: "generateFixedJ2000KPPrediction + celestialGeometry + runFullPackageDualFrameChallenger",
      fixedBackground: "fixed Aries-zero zodiac wheel",
      hamalAnchor: "13° Aries (configuration boundary; engine adapter does not silently alter formulas)",
    },
    chart: {
      godView: fixedGodChartSnapshot(activePrediction, startTime),
    agentView: input.agentViewModel === "fixed-earth-dawn-anchored"
        ? dawnAgentChartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, dualFrame.agent.ascendantLongitude, startTime)
        : chartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>),
      celestialGeometry,
    },
    experimentalLayers: {
      status: "experimental-read-only" as const,
      note: "These four evidence layers are calculated for audit/backtest inspection only and do not modify the existing live baseline or 21-method frame synthesis.",
      godView: godExperimental,
      agentView: agentExperimental,
    },
    methodResults: {
      registryVersion: "METHOD_REGISTRY_V1",
      snapshotConvention: "aries-zero-360-equal-houses-v1",
      godView: godMethodResults,
      agentView: agentMethodResults,
    },
    baseline: {
      territorial: activePrediction.territorial,
      kpStellar: activePrediction.kpStellar,
      combined: activePrediction.combined,
      winner: baselineWinner,
      verdict: baselineVerdict,
    },
    godView: frameReport(dualFrame.god, actualWinner),
    agentView: frameReport(dualFrame.agent, actualWinner),
    synthesisView: { ...predictiveSynthesis, verdict: verdictFor(predictiveSynthesis.winner, actualWinner) },
    frameParity: dualFrame.parity,
    comparison: {
      state: dualFrame.agreement.state,
      winner: dualFrame.agreement.winner,
      actualWinner: actualWinner ?? null,
      verified: Boolean(actualWinner),
    },
  };
}

export function runSimulationBatch(events: SimulationEventInput[]) {
  const results = events.map((event) => runSimulationEvent(event));
  const verified = results.filter((result) => result.comparison.verified);
  const hits = verified.filter((result) => result.baseline.verdict === "hit").length;
  return {
    results,
    summary: {
      total: results.length,
      verified: verified.length,
      unverified: results.length - verified.length,
      baselineHits: hits,
      baselineMisses: verified.length - hits,
      baselineAccuracy: verified.length ? Number(((hits / verified.length) * 100).toFixed(1)) : null,
    },
  };
}

```

## FILE: server/engine/completeChartLedger.ts

Git blob SHA: `52b4871132e31016e15b4157adb16ec391d7eaf9`

```typescript
export type ChartBody={planet:string;longitude:number;house:number;sign:string;degreeInSign?:number;nakshatra:string;manzil?:{name:string}};
export const TEAM_A_HOUSES=[1,2,3,6,10,11] as const;
export const TEAM_B_HOUSES=[4,5,7,8,9,12] as const;
export function chartSide(house:number):"A"|"B" {if(TEAM_A_HOUSES.includes(house as never))return "A";if(TEAM_B_HOUSES.includes(house as never))return "B";throw new Error("Invalid competitive house "+house)}
const normalize=(v:number)=>((v%360)+360)%360;
export function completeChartLedger(planets:ChartBody[]){
 const houses=Array.from({length:12},(_,i)=>({house:i+1,side:chartSide(i+1),occupants:planets.filter(p=>p.house===i+1).map(p=>p.planet)}));
 const bodies=planets.map(p=>({planet:p.planet,house:p.house,side:chartSide(p.house),longitude:p.longitude,sign:p.sign,nakshatra:p.nakshatra,manzil:p.manzil?.name??null,decan:Math.min(3,Math.max(1,Math.floor((p.degreeInSign ?? normalize(p.longitude)%30)/10)+1))}));
 const targets=[{name:"conjunction",angle:0},{name:"sextile",angle:60},{name:"square",angle:90},{name:"trine",angle:120},{name:"opposition",angle:180}];
 const aspects: Array<{left:string;right:string;leftHouse:number;rightHouse:number;leftSide:"A"|"B";rightSide:"A"|"B";kind:string;orb:number;crossSide:boolean}>=[];
 for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){
  const p=planets[i]!,q=planets[j]!,diff=Math.abs(normalize(p.longitude)-normalize(q.longitude)),distance=Math.min(diff,360-diff);
  const match=targets.map(t=>({...t,orb:Math.abs(distance-t.angle)})).sort((a,b)=>a.orb-b.orb)[0]!;
  if(match.orb>5)continue;
  aspects.push({left:p.planet,right:q.planet,leftHouse:p.house,rightHouse:q.house,leftSide:chartSide(p.house),rightSide:chartSide(q.house),kind:match.name,orb:Number(match.orb.toFixed(3)),crossSide:chartSide(p.house)!==chartSide(q.house)});
 }
 return {houses,bodies,aspects};
}

```

## FILE: server/engine/collectiveFamilyAudit.ts

Git blob SHA: `47f4c1d55bc7e9b434f62224fc2701d7c12953eb`

```typescript
import {chartSide,completeChartLedger,type ChartBody} from "./completeChartLedger";
export type FamilyAudit = {
  sides:{A:{houses:number[];occupants:string[];houseRulers:string[]};B:{houses:number[];occupants:string[];houseRulers:string[]}};
  chartBodyCount:number;
  aspectCount:number;
  crossFamilyContacts:number;
  evidence:string[];
};
const SIGNS=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const RULERS=["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
const normalize=(value:number)=>((value%360)+360)%360;
export function buildFamilyAudit(planets:ChartBody[],ascendantLongitude:number,mode:"god"|"agent"):FamilyAudit{
 if(!Number.isFinite(ascendantLongitude))throw new Error("Family audit requires finite ascendant");
 const ledger=completeChartLedger(planets);
 if(ledger.houses.length!==12||new Set(ledger.houses.map(h=>h.house)).size!==12)throw new Error("Family audit requires twelve unique houses");
 if(planets.length===0)throw new Error("Family audit requires planetary positions");
 for(const p of planets){
  if(!Number.isFinite(p.longitude)||p.house<1||p.house>12||!Number.isInteger(p.house))throw new Error("Invalid chart position for "+p.planet);
  if(!p.nakshatra||!p.manzil?.name)throw new Error("Missing lunar mansion evidence for "+p.planet);
 }
 const lord=(house:number)=>{
  const longitude=normalize((mode==="god"?0:ascendantLongitude)+(house-1)*30);
  return RULERS[Math.floor(longitude/30)]!;
 };
 const side=(key:"A"|"B")=>{
  const houses=ledger.houses.filter(h=>h.side===key);
  return {houses:houses.map(h=>h.house),occupants:houses.flatMap(h=>h.occupants),houseRulers:houses.map(h=>lord(h.house))};
 };
 const evidence=ledger.bodies.map(p=>`${p.planet}: H${p.house} ${p.side}; ${p.sign} ${p.longitude.toFixed(3)}°, Nakshatra ${p.nakshatra}, Manzil ${p.manzil}, decan ${p.decan}`);
 evidence.push(...ledger.aspects.map(a=>`${a.left} H${a.leftHouse}(${a.leftSide})/${a.right} H${a.rightHouse}(${a.rightSide}): ${a.kind} orb ${a.orb}°; ${a.crossSide?"cross-family":"within-family"}`));
 return {sides:{A:side("A"),B:side("B")},chartBodyCount:ledger.bodies.length,aspectCount:ledger.aspects.length,crossFamilyContacts:ledger.aspects.filter(a=>a.crossSide).length,evidence};
}
export function attachFamilyAudit<T extends {calculation?:{formula:string;inputs:string[];steps:string[]};detail:string}>(layer:T,audit:FamilyAudit):T{
 const calculation=layer.calculation??{formula:"No explicit scoring calculation",inputs:[],steps:[]};
 return {...layer,calculation:{...calculation,inputs:[...calculation.inputs,...audit.evidence.map(x=>"FAMILY EVIDENCE (not additional score): "+x)],steps:[...calculation.steps,`Collective coverage: A houses ${audit.sides.A.houses.join(",")}; B houses ${audit.sides.B.houses.join(",")}; ${audit.chartBodyCount} bodies; ${audit.aspectCount} qualifying aspects including ${audit.crossFamilyContacts} cross-family`]}} as T;
}

```

## FILE: server/engine/crossFrameSynthesis.ts

Git blob SHA: `c29cd6e5b4bd364375e4d7a7eebbaff689a76364`

```typescript
export type SynthesisSide = "A" | "B" | "TIE";
export type FrameMethod = { name: string; scoreA: number; scoreB: number; winner?: SynthesisSide };
export type SynthesizedMethod = { name: string; scoreA: number; scoreB: number; winner: SynthesisSide; godScoreA:number; godScoreB:number; agentScoreA:number; agentScoreB:number; formula:string };
export type SynthesisPrediction = { version: "CROSS_FRAME_SYNTHESIS_V1"; scoreA:number; scoreB:number; margin:number; winner:SynthesisSide; methods:SynthesizedMethod[]; formula:string; valid:boolean; reason:string };
const round=(x:number)=>Math.round(x*100)/100;
const winner=(a:number,b:number,threshold=0):SynthesisSide=>Math.abs(a-b)<threshold || a===b?"TIE":a>b?"A":"B";

/** Standalone deterministic predictive output: exactly one joint score per matched method.
 * This does not use historical outcomes or tune weights. God and Agent are
 * correlated observations of one sky, so 50/50 blending is a hypothesis.
 */
export function synthesizeFramePredictions(god:readonly FrameMethod[],agent:readonly FrameMethod[],parityValid:boolean):SynthesisPrediction{
 const byAgent=new Map(agent.map(x=>[x.name,x]));
 const valid=parityValid && god.length===21 && agent.length===21 && new Set(god.map(x=>x.name)).size===21 && new Set(agent.map(x=>x.name)).size===21 && god.every(x=>byAgent.has(x.name));
 const methods: SynthesizedMethod[]=valid?god.map(g=>{
  const a=byAgent.get(g.name)!;
  const scoreA=round((g.scoreA+a.scoreA)/2),scoreB=round((g.scoreB+a.scoreB)/2);
  return {name:g.name,scoreA,scoreB,winner:winner(scoreA,scoreB),godScoreA:g.scoreA,godScoreB:g.scoreB,agentScoreA:a.scoreA,agentScoreB:a.scoreB,formula:"Synthesis A/B = 0.5 × God A/B + 0.5 × Agent A/B"};
 }):[];
 const scoreA=round(methods.reduce((t,m)=>t+m.scoreA,0)),scoreB=round(methods.reduce((t,m)=>t+m.scoreB,0));
 return {version:"CROSS_FRAME_SYNTHESIS_V1",scoreA,scoreB,margin:round(Math.abs(scoreA-scoreB)),winner:valid?winner(scoreA,scoreB,1.5):"TIE",methods,valid,reason:valid?"Matched all 21 methods with equal fixed coefficients in both frames.":"Invalid parity, missing method, or unexpected method count. Prediction withheld.",formula:"Each of 21 synthesis methods averages matching God and Agent A/B scores equally; sum the 21 outputs; differential below 1.5 is a tie."};
}

```

## FILE: server/engine/methodRegistry.ts

Git blob SHA: `44dfd42ced6df2415e186a8d5d23305389859c7d`

```typescript
import {
  calculateAshtakavargaLayer,
  calculateDashaLayer,
  calculateHarmonicSpectrum,
  calculateHarmonicSpectrumV2,
  calculateVargaLayer,
  DEFAULT_HARMONICS,
  DEFAULT_HARMONICS_V2,
  type ExperimentalLayerVerdict,
  type HarmonicConfig,
} from "./experimentalLayers";
import type { Prediction } from "./firmamentEngine";
import { buildMethodChartSnapshot, type MethodChartSnapshot } from "./methodChartSnapshot";

export type MethodMode = "PREDICTIVE" | "EVIDENCE_ONLY";
export type MethodPrediction = "A" | "B" | "TIE" | "NONE";
export type RequiredInput = "prediction" | "eventTime" | "natalContext";
export type MethodEvidence = {
  type: string;
  planet?: string;
  house?: number;
  aspect?: string;
  orb?: number;
  resonance?: number;
  value?: number;
  explanation: string;
};
export type MethodInput = {
  prediction: Prediction;
  eventTime: Date;
  natalContext?: { prediction: Prediction; birthTime: Date };
};
export type MethodResult = {
  methodId: string;
  mode: MethodMode;
  evaluable: boolean;
  scoreA: number | null;
  scoreB: number | null;
  prediction: MethodPrediction;
  confidence: number | null;
  evidence: MethodEvidence[];
  detail: string;
  calculationVersion: string;
};
export type MethodSpec = {
  id: string;
  name: string;
  family: string;
  version: string;
  mode: MethodMode;
  requiredInputs: readonly RequiredInput[];
  configuration: Readonly<Record<string, unknown>>;
  run(input: MethodInput): MethodResult;
};

function resultFromVerdict(spec: Pick<MethodSpec, "id" | "mode" | "version">, verdict: ExperimentalLayerVerdict): MethodResult {
  const evaluable = verdict.winner !== "NOT_EVALUABLE";
  const evidence = verdict.evidence.map((item) => ({ type: "layer-evidence", value: Number.isFinite(Number(item.value)) ? Number(item.value) : undefined, explanation: `${item.label}: ${item.value}` }));
  return {
    methodId: spec.id,
    mode: spec.mode,
    evaluable,
    scoreA: spec.mode === "PREDICTIVE" && evaluable ? verdict.scoreA : null,
    scoreB: spec.mode === "PREDICTIVE" && evaluable ? verdict.scoreB : null,
    prediction: spec.mode === "PREDICTIVE" && evaluable ? verdict.winner === "NOT_EVALUABLE" ? "NONE" : verdict.winner : "NONE",
    confidence: spec.mode === "PREDICTIVE" && evaluable ? verdict.confidence : null,
    evidence,
    detail: verdict.rationale.join(" "),
    calculationVersion: spec.version,
  };
}

const withConfig = (config: readonly HarmonicConfig[]) => Object.freeze(config.map((entry) => ({ ...entry })));

export const METHOD_REGISTRY: readonly MethodSpec[] = Object.freeze([
  {
    id: "HARMONICS_V1",
    name: "H2-H12 harmonic family coherence (Gaussian, calibrated orbs)",
    family: "Harmonics",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { model: "GAUSSIAN", harmonics: withConfig(DEFAULT_HARMONICS) },
    run: (input) => resultFromVerdict(METHOD_REGISTRY[0]!, calculateHarmonicSpectrum(input.prediction, DEFAULT_HARMONICS).verdict),
  },
  {
    id: "HARMONICS_V2",
    name: "H2-H12 harmonic family coherence (universal 5-degree linear)",
    family: "Harmonics",
    version: "2.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { model: "LINEAR", maxOrbDeg: 5, harmonics: withConfig(DEFAULT_HARMONICS_V2) },
    run: (input) => resultFromVerdict(METHOD_REGISTRY[1]!, calculateHarmonicSpectrumV2(input.prediction, DEFAULT_HARMONICS_V2).verdict),
  },
  ...([3, 9, 10, 27, 30] as const).map((division) => ({
    id: `VARGA_D${division}_V1`,
    name: `D${division} independent structural placement`,
    family: "Vargas",
    version: "1.0.0",
    mode: "PREDICTIVE" as const,
    requiredInputs: ["prediction", "eventTime"] as const,
    configuration: { division, mapping: division === 3 ? "PARASHARI" : division === 9 ? "PARASHARI_NAVAMSA" : division === 10 ? "PARASHARI_DASAMSA" : division === 27 ? "TRADITIONAL_ELEMENTAL_BASELINE" : "PARASHARI_TRIMSAMSA" },
    run: (input: MethodInput) => {
      const verdict = calculateVargaLayer(input.prediction, [division]).verdict;
      return resultFromVerdict({ id: `VARGA_D${division}_V1`, mode: "PREDICTIVE", version: "1.0.0" }, verdict);
    },
  })),
  {
    id: "ASHTAKAVARGA_V1",
    name: "Classical BAV/SAV positional support",
    family: "Ashtakavarga",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { references: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"], excludes: ["Rahu", "Ketu"] },
    run: (input) => resultFromVerdict({ id: "ASHTAKAVARGA_V1", mode: "PREDICTIVE", version: "1.0.0" }, calculateAshtakavargaLayer(input.prediction).verdict),
  },
  {
    id: "EVENT_LUNAR_DASHA_CHAIN_V1",
    name: "Event-time Nakshatra/Sub/Sub-Sub chain",
    family: "Dasha",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { natalContext: false, chain: ["Nakshatra", "Sub", "Sub-Sub"] },
    run: (input) => resultFromVerdict({ id: "EVENT_LUNAR_DASHA_CHAIN_V1", mode: "PREDICTIVE", version: "1.0.0" }, calculateDashaLayer(input.prediction, input.eventTime).verdict),
  },
  {
    id: "NATAL_VIMSHOTTARI_V1",
    name: "Natal Vimshottari Mahadasha/Antardasha/Pratyantardasha",
    family: "Dasha",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime", "natalContext"],
    configuration: { sequenceYears: 120, levels: ["mahadasha", "antardasha", "pratyantardasha"] },
    run: (input) => resultFromVerdict({ id: "NATAL_VIMSHOTTARI_V1", mode: "PREDICTIVE", version: "1.0.0" }, calculateDashaLayer(input.prediction, input.eventTime, undefined, input.natalContext).verdict),
  },
]);

export function getMethodSpec(methodId: string) { return METHOD_REGISTRY.find((method) => method.id === methodId); }
export function runMethod(methodId: string, input: MethodInput): MethodResult {
  const method = getMethodSpec(methodId);
  if (!method) throw new Error(`Unknown method: ${methodId}`);
  if (method.requiredInputs.includes("natalContext") && !input.natalContext) {
    return { methodId: method.id, mode: method.mode, evaluable: false, scoreA: null, scoreB: null, prediction: "NONE", confidence: null, evidence: [], detail: "Natal context is required for this method.", calculationVersion: method.version };
  }
  return method.run(input);
}
export function runRegisteredMethodsFromSnapshot(snapshot: MethodChartSnapshot, methodIds = METHOD_REGISTRY.map((method) => method.id)) {
  return methodIds.map((methodId) => runMethod(methodId, {
    prediction: snapshot.prediction,
    // Method-specific timing doctrine sees the event time but cannot advance
    // the shared snapshot clock for the next method.
    eventTime: new Date(snapshot.eventTime.getTime()),
  }));
}

/** Backward-compatible entry point; new simulations build each frame once. */
export function runRegisteredMethods(input: MethodInput, methodIds = METHOD_REGISTRY.map((method) => method.id)) {
  return methodIds.map((methodId) => runMethod(methodId, input));
}

export { buildMethodChartSnapshot };

```

## FILE: server/engine/houseFrameFoundation.ts

Git blob SHA: `62e6ec55454dc5c6eaaaf0070f75021dadc092d5`

```typescript
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
  return normalizeLongitude(houseAnchor(frame, ascendantLongitude) + (house - 1) * 30);
}

export function locateInHouse(longitude: number, frame: FirmamentFrame, ascendantLongitude: number): HousePosition {
  const relative = normalizeLongitude(longitude - houseAnchor(frame, ascendantLongitude));
  const house = Math.floor(relative / 30) + 1;
  return {
    house,
    startLongitude: houseCusp(house, frame, ascendantLongitude),
    endLongitude: houseCusp(house === 12 ? 1 : house + 1, frame, ascendantLongitude),
    degreeInHouse: relative - (house - 1) * 30,
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
          house: h + 1,
          startLongitude: normalizeLongitude(houseAnchor(frame, ascendantLongitude) + left),
          endLongitude: normalizeLongitude(houseAnchor(frame, ascendantLongitude) + right),
          degrees: right - left,
        });
      }
    }
  }
  return overlaps.sort((a, b) => normalizeLongitude(a.startLongitude - start) - normalizeLongitude(b.startLongitude - start));
}

```

## FILE: server/engine/dawnAnchoredAscendant.ts

Git blob SHA: `892f91ab92cf7650a17f89c6ecf06dd3173e0ce2`

```typescript
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

```

## FILE: server/engine/neutralMethodAudit.ts

Git blob SHA: `ca0920f0d8058a1cc0d98952772776462f085391`

```typescript
export type NeutralMethodDiagnosticStatus =
  | "triggered"
  | "valid-neutral"
  | "shared-evidence-only"
  | "hard-coded-neutral"
  | "missing-input"
  | "unexplained";

export type NeutralMethodDiagnostic = {
  method: string;
  status: NeutralMethodDiagnosticStatus;
  reason: string;
  actionable: boolean;
};

type Layer = {
  name: string;
  scoreA: number;
  scoreB: number;
  ruleClass?: string;
  detail?: string;
  calculation?: { formula?: string; inputs?: string[]; steps?: string[] };
};

function textFor(layer: Layer) {
  return [layer.detail, layer.calculation?.formula, ...(layer.calculation?.inputs ?? []), ...(layer.calculation?.steps ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Classifies zero-differential layers without changing their scores.
 * This is an audit contract: a neutral output must either be explained by a
 * real calculation, explicitly shared evidence, or be flagged for work.
 */
export function auditNeutralMethod(layer: Layer): NeutralMethodDiagnostic {
  const text = textFor(layer);
  const hasOutput = Math.abs(layer.scoreA) > 0 || Math.abs(layer.scoreB) > 0;
  if (hasOutput && layer.scoreA === layer.scoreB) return { method: layer.name, status: "valid-neutral", reason: "Both sides received equal nonzero scores; the directional differential is zero.", actionable: false };
  if (hasOutput) return { method: layer.name, status: "triggered", reason: "The method produced unequal A/B scores and a directional contribution.", actionable: false };
  if (/unavailable|missing|requires/i.test(text)) return { method: layer.name, status: "missing-input", reason: layer.detail ?? "The method did not receive a required input.", actionable: true };
  if (/void-of-course remains false|todo/i.test(text)) return { method: layer.name, status: "hard-coded-neutral", reason: layer.detail ?? "The method is currently forced to a neutral output.", actionable: true };
  if (layer.ruleClass === "SHARED" && /evidence only|favors neither|environment-only|does not count toward the winner/i.test(text)) {
    return { method: layer.name, status: "shared-evidence-only", reason: layer.detail ?? "The method records shared context and is not allowed to move the A/B differential.", actionable: false };
  }
  if (/hard-coded|fixed at 0 \/ 0/i.test(text)) return { method: layer.name, status: "hard-coded-neutral", reason: layer.detail ?? "The method is currently forced to a neutral output.", actionable: true };
  if (layer.calculation && layer.detail) return { method: layer.name, status: "valid-neutral", reason: layer.detail, actionable: false };
  return { method: layer.name, status: "unexplained", reason: "Zero contribution without a complete calculation trace.", actionable: true };
}

export function auditNeutralMethods(layers: Layer[]) {
  return layers.map(auditNeutralMethod);
}

```

## FILE: server/engine/index.ts

Git blob SHA: `6cf248387ee2abfe9a7dc636c3c8a0edb5af6b2b`

```typescript
export * from "./firmamentEngine";
export * from "./territorialStack";
export * from "./fullPackageDualFrameChallenger";
export * from "./celestialGeometry";
export * from "./personalChart";
export * from "./sportsFeatureExperiment";
export * from "./experimentalLayers";
export * from "./chartEvidence";
export * from "./methodRegistry";

```

## FILE: server/engine/methodScoringWalkthrough.test.ts

Git blob SHA: `91c16596f4d262b0ecd73ae59af7152ced337a9a`

```typescript
import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("method-by-method transparent scoring walkthrough",()=>{
 it("shows actual rule, scoring inputs, steps, whole family context, and A/B arithmetic for each of 21 methods per frame",()=>{
  const e=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  for(const game of runSimulationBatch(e).results)for(const frame of [game.godView,game.agentView]){
   expect(frame.proof.methodWalkthrough).toHaveLength(21);
   frame.proof.methodWalkthrough.forEach((m,i)=>{
    expect(m.method).toBe(frame.allLayers[i].name);
    expect(m.scoreA).toBe(frame.allLayers[i].scoreA);
    expect(m.scoreB).toBe(frame.allLayers[i].scoreB);
    expect(m.housesA).toEqual([1,2,3,6,10,11]);
    expect(m.housesB).toEqual([4,5,7,8,9,12]);
    expect(m.appliedRule.length).toBeGreaterThan(0);
    expect(m.familyEvidence.length).toBeGreaterThan(0);
    expect(m.familyEvidence.every(x=>x.startsWith("FAMILY EVIDENCE (not additional score):"))).toBe(true);
    expect(m.scoringInputs.every(x=>!x.startsWith("FAMILY EVIDENCE (not additional score):"))).toBe(true);
    expect(m.differenceAminusB).toBeCloseTo(m.scoreA-m.scoreB,2);
   });
  }
 });
});
```

## FILE: server/engine/annualRivalryPilot.test.ts

Git blob SHA: `9924dc614d12ed36e0d7256605f474237c83005e`

```typescript
import { describe, expect, it } from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
const data=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8"));
describe("annual rivalry recurring-cohort exploratory pilot",()=>{
 it("compares God Agent Synthesis and favorite baseline on complete sourced fixtures",()=>{
  const fixtures=data.events;
  expect(fixtures).toHaveLength(7);
  const result=runSimulationBatch(fixtures);
  const perGame=result.results.map((game,i)=>{
   const f=fixtures[i];
   expect(game.synthesisView.methods).toHaveLength(21);
   expect(game.godView.allLayers).toHaveLength(21);
   expect(game.agentView.allLayers).toHaveLength(21);
   const views={god:game.godView.synthesis.winner,agent:game.agentView.synthesis.winner,synthesis:game.synthesisView.winner,baseline:game.baseline.winner,favorite:"A"};
   return {id:f.id,rivalry:f.rivalry,year:new Date(f.startTime).getUTCFullYear(),favored:f.teamA,underdog:f.teamB,actual:f.actualWinner,kickoffQuality:f.kickoffQuality,source:f.sourceUrl,views,methodResults:{god:game.godView.allLayers.map((x)=>({name:x.name,pick:x.winner,scoreA:x.scoreA,scoreB:x.scoreB})),agent:game.agentView.allLayers.map((x)=>({name:x.name,pick:x.winner,scoreA:x.scoreA,scoreB:x.scoreB})),synthesis:game.synthesisView.methods.map((x)=>({name:x.name,pick:x.winner,scoreA:x.scoreA,scoreB:x.scoreB}))}};
  });
  const counts=Object.fromEntries(["god","agent","synthesis","baseline","favorite"].map(k=>[k,{hit:perGame.filter(v=>(v.views as any)[k]===v.actual).length,tie:perGame.filter(v=>(v.views as any)[k]==="TIE").length}]));
  const methods=perGame[0].methodResults.synthesis.map((m:any)=>({name:m.name, ...Object.fromEntries(["god","agent","synthesis"].map(k=>[k,{hit:perGame.filter(v=>(v.methodResults as any)[k].find((n:any)=>n.name===m.name)?.pick===v.actual).length,tie:perGame.filter(v=>(v.methodResults as any)[k].find((n:any)=>n.name===m.name)?.pick==="TIE").length}]))}));
  const byRivalry=[...new Set(perGame.map(g=>g.rivalry))].map(name=>({name,games:perGame.filter(g=>g.rivalry===name).length, ...Object.fromEntries(["god","agent","synthesis","favorite"].map(k=>[k,perGame.filter(v=>v.rivalry===name && (v.views as any)[k]===v.actual).length]))}));
  console.log("FIRMAMENT_RIVALRY_REPORT="+JSON.stringify({games:perGame.length,counts,byRivalry,methods,perGame:perGame.map(({methodResults,...row})=>row)}));
 });
});

```

## FILE: real-events/annual-rivalry-pilot.json

Git blob SHA: `b8bd070d7dc726b80479ec4aa83b8d68aea417ca`

```json
{
  "description": "Annual rivalry pilot. Kickoff marked actual or scheduled. Market odds favorite requires final independent source audit before primary research. Scores exploratory.",
  "events": [
    {
      "id": "rivalry-2023-michigan-osu",
      "rivalry": "The Game",
      "teamA": "Michigan Wolverines",
      "teamB": "Ohio State Buckeyes",
      "sport": "NCAAF",
      "location": "Michigan Stadium, Ann Arbor, MI",
      "latitude": 42.2658,
      "longitude": -83.7487,
      "startTime": "2023-11-25T17:00:00Z",
      "actualWinner": "A",
      "favoredTeam": "Michigan Wolverines",
      "underdogTeam": "Ohio State Buckeyes",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "scheduled",
      "sourceUrl": "https://www.fanduel.com/research/ohio-state-michigan-spread-total-breakdown-and-best-bet-for-the-game"
    },
    {
      "id": "rivalry-2024-michigan-osu",
      "rivalry": "The Game",
      "teamA": "Ohio State Buckeyes",
      "teamB": "Michigan Wolverines",
      "sport": "NCAAF",
      "location": "Ohio Stadium, Columbus, OH",
      "latitude": 40.0017,
      "longitude": -83.0197,
      "startTime": "2024-11-30T17:00:00Z",
      "actualWinner": "B",
      "favoredTeam": "Ohio State Buckeyes",
      "underdogTeam": "Michigan Wolverines",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "scheduled",
      "sourceUrl": "https://ohiostatebuckeyes.com/sports/football/schedule/text/2024"
    },
    {
      "id": "rivalry-2023-iron-bowl",
      "rivalry": "Iron Bowl",
      "teamA": "Alabama Crimson Tide",
      "teamB": "Auburn Tigers",
      "sport": "NCAAF",
      "location": "Jordan-Hare Stadium, Auburn, AL",
      "latitude": 32.6022,
      "longitude": -85.4899,
      "startTime": "2023-11-25T20:40:00Z",
      "actualWinner": "A",
      "favoredTeam": "Alabama Crimson Tide",
      "underdogTeam": "Auburn Tigers",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "actual",
      "sourceUrl": "https://rolltide.com/sports/football/stats/2023/auburn/boxscore/15092"
    },
    {
      "id": "rivalry-2024-iron-bowl",
      "rivalry": "Iron Bowl",
      "teamA": "Alabama Crimson Tide",
      "teamB": "Auburn Tigers",
      "sport": "NCAAF",
      "location": "Bryant-Denny Stadium, Tuscaloosa, AL",
      "latitude": 33.2083,
      "longitude": -87.5504,
      "startTime": "2024-11-30T20:30:00Z",
      "actualWinner": "A",
      "favoredTeam": "Alabama Crimson Tide",
      "underdogTeam": "Auburn Tigers",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "scheduled",
      "sourceUrl": "https://auburntigers.com/news/2024/11/27/the-opening-drive-2024-auburn-at-alabama"
    },
    {
      "id": "rivalry-2025-iron-bowl",
      "rivalry": "Iron Bowl",
      "teamA": "Alabama Crimson Tide",
      "teamB": "Auburn Tigers",
      "sport": "NCAAF",
      "location": "Jordan-Hare Stadium, Auburn, AL",
      "latitude": 32.6022,
      "longitude": -85.4899,
      "startTime": "2025-11-30T00:30:00Z",
      "actualWinner": "A",
      "favoredTeam": "Alabama Crimson Tide",
      "underdogTeam": "Auburn Tigers",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "scheduled",
      "sourceUrl": "https://www.foxsports.com/articles/college-football/alabama-vs-auburn-prediction-odds-picks-november-29-2025"
    },
    {
      "id": "rivalry-2023-red-river",
      "rivalry": "Red River",
      "teamA": "Texas Longhorns",
      "teamB": "Oklahoma Sooners",
      "sport": "NCAAF",
      "location": "Cotton Bowl, Dallas, TX",
      "latitude": 32.7797,
      "longitude": -96.7599,
      "startTime": "2023-10-07T16:00:00Z",
      "actualWinner": "B",
      "favoredTeam": "Texas Longhorns",
      "underdogTeam": "Oklahoma Sooners",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "scheduled",
      "sourceUrl": "https://www.fanduel.com/research/college-football-betting-picks-for-saturday-10-7-23"
    },
    {
      "id": "rivalry-2024-red-river",
      "rivalry": "Red River",
      "teamA": "Texas Longhorns",
      "teamB": "Oklahoma Sooners",
      "sport": "NCAAF",
      "location": "Cotton Bowl, Dallas, TX",
      "latitude": 32.7797,
      "longitude": -96.7599,
      "startTime": "2024-10-12T19:30:00Z",
      "actualWinner": "A",
      "favoredTeam": "Texas Longhorns",
      "underdogTeam": "Oklahoma Sooners",
      "roleAssignmentSource": "market-odds",
      "kickoffQuality": "scheduled",
      "sourceUrl": "https://texaslonghorns.com/news/2024/5/30/football-kickoff-times-set-for-utsa-allstate-red-river-rivalry"
    }
  ]
}
```
