import { shadowSide, opposite } from "./oppositionShadow";
import { shadowReferenceIdentities } from "./shadowCoordinates";
const STARS = [
  ["Regulus",135],["Aldebaran",45],["Antares",225],["Fomalhaut",315],
  ["Sirius",104],["Polaris",0],["Spica",173.833],["Arcturus",164.183],
  ["Denebola",182],["Algol",56.683],["Bellatrix",162],
] as const;
const ASPECTS = [
  { name: "conjunction", angle: 0, kind: "friction" },
  { name: "sextile", angle: 60, kind: "flow" },
  { name: "square", angle: 90, kind: "friction" },
  { name: "trine", angle: 120, kind: "flow" },
  { name: "opposition", angle: 180, kind: "friction" },
] as const;
export const distance = (a: number, b: number) => {
  const delta = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(delta, 360 - delta);
};
export const orbWeight = (orb: number) => orb > 5 ? 0 : orb <= 1 ? 1 : orb <= 2 ? 0.8 : orb <= 3 ? 0.6 : orb <= 4 ? 0.4 : 0.2;
type Planet = { planet: string; house: number; tropicalLongitude: number; backgroundWheelLongitude: number };
type Chart = { planets: Planet[]; houses: Array<{ house: number; cuspLongitude: number }> };
export function scoreOppositionShadow(chart: Chart) {
  const methods = {
    houseTerritory: { A: 0, B: 0 },
    stellarContacts: { A: 0, B: 0 },
    houseCuspAspects: { A: 0, B: 0 },
    planetaryFlow: { A: 0, B: 0 },
    planetaryFriction: { A: 0, B: 0 },
  };
  const planets = chart.planets.map(p => ({ ...p, shadowHouse: ((p.house + 5) % 12) + 1, identities: shadowReferenceIdentities(p.backgroundWheelLongitude) }));
  const evidence: Array<{ method: string; planet: string; side: "A" | "B"; detail: string; weight: number }> = [];
  for (const p of planets) {
    const side = shadowSide(p.shadowHouse);
    methods.houseTerritory[side] += 1;
    evidence.push({ method: "houseTerritory", planet: p.planet, side, detail: "Shadow house " + p.shadowHouse, weight: 1 });
    for (const [star, longitude] of STARS) {
      const orb = distance(p.backgroundWheelLongitude, opposite(longitude));
      const weight = orbWeight(orb);
      if (weight) {
        methods.stellarContacts[side] += weight;
        evidence.push({ method: "stellarContacts", planet: p.planet, side, detail: star + " rotated reference; orb " + orb.toFixed(3), weight });
      }
    }
    for (const cusp of chart.houses) {
      const targetSide = shadowSide(cusp.house);
      const separation = distance(p.backgroundWheelLongitude, opposite(cusp.cuspLongitude));
      for (const aspect of ASPECTS) {
        const orb = Math.abs(separation - aspect.angle);
        const weight = orbWeight(orb);
        if (!weight) continue;
        const method = aspect.kind === "flow" ? "planetaryFlow" : "planetaryFriction";
        methods[method][targetSide] += weight;
        methods.houseCuspAspects[targetSide] += weight;
        evidence.push({ method, planet: p.planet, side: targetSide, detail: "Shadow house " + cusp.house + " " + aspect.name + " orb " + orb.toFixed(3), weight });
      }
    }
  }
  return {
    mode: "experimental-reference-wheel-180" as const,
    eligibleForProductionPrediction: false,
    favoriteSide: "A" as const,
    underdogSide: "B" as const,
    orbDegrees: 5,
    methods,
    evidence,
    planets: planets.map(p => ({ planet: p.planet, tropicalLongitude: p.tropicalLongitude, originalHouse: p.house, shadowHouse: p.shadowHouse, ...p.identities })),
    caveat: "Counterfactual reference transform. These independent shadow diagnostics do not represent a full rerun of the legacy 21-method package.",
  };
}
