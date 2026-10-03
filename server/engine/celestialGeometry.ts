import { ARABIC_LUNAR_MANSIONS, MANZIL_ARC_DEGREES, NAKSHATRAS, NAKSHATRA_ARC_DEGREES, type ManzilReading } from "./firmamentEngine";

export const CELESTIAL_ASPECT_ANGLES = [0, 30, 45, 60, 72, 90, 108, 120, 135, 144, 150, 180] as const;
export const CELESTIAL_ASPECT_ORB = 5;

type Position = { planet: string; longitude: number; nakshatra: string; manzil: ManzilReading };

type GeometryAspect = {
  source: string;
  target: string;
  relationship: string;
  exactAngle: number;
  orb: number;
  weight: number;
  sourceLongitude: number;
  targetLongitude: number;
};

const normalize = (value: number) => ((value % 360) + 360) % 360;
const distance = (a: number, b: number) => {
  const delta = Math.abs(normalize(a) - normalize(b));
  return Math.min(delta, 360 - delta);
};
const aspectName = (angle: number) => ({ 0: "conjunction", 30: "semisextile", 45: "semisquare", 60: "sextile", 72: "quintile", 90: "square", 108: "triquintile", 120: "trine", 135: "sesquiquadrate", 144: "biquintile", 150: "quincunx", 180: "opposition" } as Record<number, string>)[angle] ?? `${angle}° relationship`;
const orbWeight = (orb: number) => orb < 0.000001 ? 5 : orb <= 1 ? 4 : orb <= 2 ? 3 : orb <= 3 ? 2 : orb <= 5 ? 1 : 0;
const ALL_MANZIL_CENTERS = ARABIC_LUNAR_MANSIONS.map((name, index) => ({ name, index: index + 1, centerLongitude: (index + 0.5) * MANZIL_ARC_DEGREES }));

function nearestAspect(a: number, b: number): { angle: number; orb: number } | null {
  const separation = distance(a, b);
  let best: { angle: number; orb: number } | null = null;
  for (const angle of CELESTIAL_ASPECT_ANGLES) {
    const orb = Math.abs(separation - angle);
    if (orb <= CELESTIAL_ASPECT_ORB && (!best || orb < best.orb)) best = { angle, orb };
  }
  return best;
}

function aspect(source: string, sourceLongitude: number, target: string, targetLongitude: number): GeometryAspect | null {
  const match = nearestAspect(sourceLongitude, targetLongitude);
  if (!match) return null;
  return { source, target, relationship: aspectName(match.angle), exactAngle: match.angle, orb: Number(match.orb.toFixed(4)), weight: orbWeight(match.orb), sourceLongitude: Number(normalize(sourceLongitude).toFixed(4)), targetLongitude: Number(normalize(targetLongitude).toFixed(4)) };
}

export function geometryRelation(source: string, sourceLongitude: number, target: string, targetLongitude: number) {
  return aspect(source, sourceLongitude, target, targetLongitude);
}

export function nakshatraCenter(nakshatra: string) {
  const index = NAKSHATRAS.indexOf(nakshatra as typeof NAKSHATRAS[number]);
  if (index < 0) return null;
  return { index: index + 1, name: nakshatra, startLongitude: index * NAKSHATRA_ARC_DEGREES, endLongitude: (index + 1) * NAKSHATRA_ARC_DEGREES, centerLongitude: (index + 0.5) * NAKSHATRA_ARC_DEGREES };
}

export function buildCelestialGeometryEvidence(planets: Position[]) {
  const planetaryAspects: GeometryAspect[] = [];
  const planetManzilAspects: GeometryAspect[] = [];
  const planetNakshatraAspects: GeometryAspect[] = [];
  const occupancy = planets.map((planet) => ({ planet: planet.planet, longitude: Number(normalize(planet.longitude).toFixed(4)), manzil: planet.manzil, nakshatra: planet.nakshatra, nakshatraCenter: nakshatraCenter(planet.nakshatra) }));

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const relation = aspect(planets[i]!.planet, planets[i]!.longitude, planets[j]!.planet, planets[j]!.longitude);
      if (relation) planetaryAspects.push(relation);
    }
    for (const manzil of ALL_MANZIL_CENTERS) {
      const relation = aspect(planets[i]!.planet, planets[i]!.longitude, `${manzil.name} center`, manzil.centerLongitude);
      if (relation) planetManzilAspects.push(relation);
    }
    for (const nakshatra of NAKSHATRAS) {
      const center = nakshatraCenter(nakshatra)!;
      const relation = aspect(planets[i]!.planet, planets[i]!.longitude, `${center.name} center`, center.centerLongitude);
      if (relation) planetNakshatraAspects.push(relation);
    }
  }

  const manzilRelationships: GeometryAspect[] = [];
  const occupiedManzils = Array.from(new Map(planets.map((planet) => [planet.manzil.index, planet.manzil])).values());
  for (let i = 0; i < occupiedManzils.length; i += 1) {
    for (let j = i + 1; j < occupiedManzils.length; j += 1) {
      const left = occupiedManzils[i]!;
      const right = occupiedManzils[j]!;
      const relation = aspect(left.name, left.centerLongitude, right.name, right.centerLongitude);
      if (relation) manzilRelationships.push(relation);
    }
  }

  const convergences = planets.flatMap((planet) => {
    const ordinary = planetaryAspects.filter((item) => item.source === planet.planet || item.target === planet.planet);
    const mansion = planetManzilAspects.filter((item) => item.source === planet.planet);
    const nakshatra = planetNakshatraAspects.filter((item) => item.source === planet.planet);
    return ordinary.flatMap((item) => {
      const target = item.target === planet.planet ? item.source : item.target;
      const matchingMansion = mansion.find((candidate) => candidate.relationship === item.relationship && candidate.target.includes("center"));
      const matchingNakshatra = nakshatra.find((candidate) => candidate.relationship === item.relationship && candidate.target.includes("center"));
      if (!matchingMansion && !matchingNakshatra) return [];
      return [{ subject: planet.planet, target, relationship: item.relationship, layers: ["planetary aspect", ...(matchingMansion ? ["Manzil-center aspect"] : []), ...(matchingNakshatra ? ["Nakshatra-center aspect"] : [])], strength: Number((item.weight + (matchingMansion?.weight ?? 0) + (matchingNakshatra?.weight ?? 0)).toFixed(2)) }];
    });
  });

  return {
    orb: CELESTIAL_ASPECT_ORB,
    aspectAngles: [...CELESTIAL_ASPECT_ANGLES],
    occupancy,
    planetaryAspects,
    planetManzilAspects,
    planetNakshatraAspects,
    manzilRelationships,
    convergences,
    counts: { occupancy: occupancy.length, planetaryAspects: planetaryAspects.length, planetManzilAspects: planetManzilAspects.length, planetNakshatraAspects: planetNakshatraAspects.length, manzilRelationships: manzilRelationships.length, convergences: convergences.length },
  };
}
