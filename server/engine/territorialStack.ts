import { ZODIAC_SIGNS, houseCusp } from "./houseFrameFoundation";
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
const SIGNS = ZODIAC_SIGNS;
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
  if (mode === "god") return HOUSE_LORDS[house-1]!;
  const cuspLongitude = houseCusp(house, "agent", ascendantLongitude);
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
 * Physically isolated entry point for ONE of the original eight Territorial
 * methods. Deliberately does not calculate the other seven layers. Keep
 * arithmetic identical to calculateRestoredTerritorial() until each
 * doctrine is independently reviewed and certified.
 */
export function calculateIndividualTerritorialLayer(
  planets: TerritorialPlanet[],
  ascendantLongitude: number,
  lotHouseFromLongitude: (longitude: number) => number,
  mode: "god" | "agent",
  methodIndex: number,
) {
  if (!Number.isInteger(methodIndex) || methodIndex < 0 || methodIndex > 7) throw new RangeError("Territorial method must be 0..7");
  const names = ["Cluster territory & house-lord placement", "Nakshatra influence", "Essential dignity",
    "Chaldean Decans", "Planetary war", "Arabic Lots", "Arabic mansion context", "Nine-planet influence"];
  const byName = new Map(planets.map(p => [p.planet, p]));
  const inputs: string[] = [];
  const steps: string[] = [];
  let scoreA = 0, scoreB = 0;
  let qualifyingScoreContributions = 0;
  function credit(side: TerritorialSide, score: number, why: string) {
    if (side !== "neutral" && score !== 0) qualifyingScoreContributions++;
    if (side === "A") scoreA += score;
    if (side === "B") scoreB += score;
    steps.push(`${why}: ${side} ${score < 0 ? "" : "+"}${score}`);
  }
  if ([0, 1, 2, 4].includes(methodIndex)) {
    const warEffects = new Map<string, number>();
    if (methodIndex === 4) {
      for (const war of detectWars(planets)) {
        warEffects.set(war.winner, (warEffects.get(war.winner) ?? 0) + 1);
        warEffects.set(war.loser, (warEffects.get(war.loser) ?? 0) - 1);
      }
    }
    for (let house = 1; house <= 12; house++) {
      const lord = lordForHouse(house, mode, ascendantLongitude);
      const side = sideForHouse(house);
      const planet = byName.get(lord);
      if (!planet) throw new Error(`H${house}: missing ruling planet ${lord}`);
      if (side === "neutral") throw new Error(`H${house}: invalid competitive side`);
      let value = 0;
      let description: string;
      if (methodIndex === 0) {
        const placementSide = sideForHouse(planet.house);
        if (placementSide === side) { value += 1; if (planet.house === house) value += 1; }
        else if (placementSide !== "neutral") { value -= 1; if ([1,4,7,10].includes(planet.house)) value -= 1; }
        description = `H${house} ${lord} placed H${planet.house}: territorial base`;
      } else if (methodIndex === 1) {
        value = nakshatraInfluence(planet.nakshatra, dignity(lord, planet.sign).score);
        description = `H${house} ${lord} in ${planet.nakshatra}: mansion trait score`;
      } else if (methodIndex === 2) {
        const d = dignity(lord, planet.sign);
        value = d.score;
        description = `H${house} ${lord} ${planet.sign}: ${d.status}`;
      } else {
        value = warEffects.get(lord) ?? 0;
        description = `H${house} ${lord}: planetary war winner/loser priority`;
      }
      inputs.push(description);
      credit(side, value, description);
    }
  } else if (methodIndex === 3) {
    for (const planet of planets) {
      if (!Number.isFinite(planet.tropicalLongitude)) throw new Error(`Decan ${planet.planet}: missing longitude`);
      const degree = normalize(planet.tropicalLongitude) % 30;
      if (planet.sign !== signForLongitude(planet.tropicalLongitude)) throw new Error(`Decan ${planet.planet}: sign/longitude mismatch`);
      const face = getChaldeanDecan(planet.sign, degree);
      const ruler = byName.get(face.ruler);
      if (!ruler) throw new Error(`Decan ${planet.planet}: missing ruler ${face.ruler}`);
      const side = sideForHouse(planet.house), rulerSide = sideForHouse(ruler.house);
      const score = side === "neutral" ? 0 :
        round((planet.planet === face.ruler ? 1 : 0) + (side === rulerSide ? .5 : rulerSide !== "neutral" ? -.5 : 0));
      const note = `${planet.planet} ${planet.sign} ${degree.toFixed(3)}° face ${face.decan} ruler ${face.ruler} H${ruler.house}`;
      inputs.push(note); credit(side, score, note);
    }
  } else if (methodIndex === 5) {
    const sunAlt = byName.get("Sun")?.altitude;
    if (sunAlt === undefined || !Number.isFinite(sunAlt)) throw new Error("Arabic Lots require finite Sun altitude");
    for (const { definition, rawLongitude } of canonicalLots(byName, ascendantLongitude, sunAlt < 0)) {
      const longitude = normalize(rawLongitude);
      const house = lotHouseFromLongitude(longitude), side = sideForHouse(house);
      const magnitude = [1,4,7,10].includes(house) ? 2 : 1;
      const value = side === "neutral" ? 0 : definition.name === "Lot of Nemesis" ? -magnitude : magnitude;
      const note = `${definition.name} at ${longitude.toFixed(3)}° H${house}, day ${definition.formulaDay} / night ${definition.formulaNight} (${definition.source})`;
      inputs.push(note); credit(side, value, note);
    }
  } else if (methodIndex === 6) {
    inputs.push(...planets.map(p => `${p.planet}: ${p.manzil?.name ?? "missing"} H${p.house}`));
    for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) {
      const l = planets[i]!, r = planets[j]!;
      if (l.manzil?.index == null || r.manzil?.index == null || l.manzil.index !== r.manzil.index) continue;
      const delta = Math.abs(normalize(l.tropicalLongitude) - normalize(r.tropicalLongitude));
      const distance = Math.min(delta,360-delta);
      if (distance > 5) continue;
      const sideL = sideForHouse(l.house), sideR = sideForHouse(r.house);
      const weight = round(Math.max(0, 1 - distance / 5));
      const note = `${l.planet}/${r.planet} manzil ${l.manzil.name} separation ${distance.toFixed(3)}°`;
      if (sideL === sideR && sideL !== "neutral") credit(sideL, weight, note);
      else steps.push(`${note}: cross-family context only, no automatic points`);
    }
  } else if (methodIndex === 7) {
    for (const planet of planets) {
      const side = sideForHouse(planet.house);
      const weight = planet.planet === "Sun" || planet.planet === "Moon" ? 1.4 : 1;
      const note = `${planet.planet} H${planet.house}: planetary body weight`;
      inputs.push(note); credit(side, side === "neutral" ? 0 : weight, note);
    }
  }
  const formulas = [
    "Σ house-lord base points by ruled side",
    "Σ ruler Nakshatra trait score including dignity modifier",
    "Σ ruler dignity by ruled side",
    "Σ face dignity and decan-ruler side allegiance across all bodies",
    "Σ ruler war winner/loser points by ruled side; conjunction threshold 3° (policy conflict)",
    "Σ sect-aware Arabic Lots with angular ×2 and Nemesis sign",
    "Σ same-side manzil pair resonance within 5°; cross-side recorded but unscored",
    "Σ body influence (Sun/Moon 1.4, other bodies 1) by occupied side",
  ];
  return {
    name: names[methodIndex]!, scoreA: round(scoreA), scoreB: round(scoreB),
    detail: `Independently ran ${names[methodIndex]}; scoring trace includes only that method.`,
    qualifyingScoreContributions,
    calculation: { formula: formulas[methodIndex]!, inputs, steps: steps.length ? steps : ["No qualifying triggers; scores are actual zero, not an equal-strength verdict."] },
  };
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
