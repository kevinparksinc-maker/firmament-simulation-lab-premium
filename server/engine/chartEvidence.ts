import type { PlanetReading, Prediction } from "./firmamentEngine";
import { calculateExperimentalLayers } from "./experimentalLayers";

type ExperimentalLayerResult = ReturnType<typeof calculateExperimentalLayers>;
export type MansionHouseCell = {
  mansion: string;
  house: number;
  planets: string[];
  sav: number;
  bav: Record<string, number>;
  harmonics: Record<string, number>;
  dasha: { mahadasha?: string; antardasha?: string; pratyantardasha?: string; activation: number };
};
export type ChartEvidenceGraph = {
  houses: Array<{ house: number; sign: string; sav: number; planets: string[]; mansion: string | null }>;
  mansions: Array<{ mansion: string; houses: number[]; planets: string[]; activation: number }>;
  cells: MansionHouseCell[];
  strongestPatterns: Array<{ mansion: string; house: number; strength: number; reasons: string[] }>;
  layers: ExperimentalLayerResult;
};

function houseSav(layers: ExperimentalLayerResult, house: number) {
  return layers.ashtakavarga.sarvashtakavarga?.houses.find((entry: { house: number; bindus: number }) => entry.house === house)?.bindus ?? 0;
}
function safeHouse(planet: PlanetReading) { return planet.house >= 1 && planet.house <= 12 ? planet.house : 0; }

export function buildChartEvidence(prediction: Prediction, eventTime: Date): ChartEvidenceGraph {
  const layers = calculateExperimentalLayers(prediction, eventTime);
  const cells = new Map<string, MansionHouseCell>();
  const mansionMap = new Map<string, { houses: Set<number>; planets: Set<string>; activation: number }>();
  const planetsByHouse = new Map<number, PlanetReading[]>();
  for (const planet of prediction.planets) {
    const house = safeHouse(planet);
    if (!house) continue;
    const housePlanets = planetsByHouse.get(house) ?? [];
    housePlanets.push(planet);
    planetsByHouse.set(house, housePlanets);
    const key = `${planet.nakshatra}:${house}`;
    const cell: MansionHouseCell = cells.get(key) ?? { mansion: planet.nakshatra, house, planets: [], sav: houseSav(layers, house), bav: {}, harmonics: {}, dasha: { activation: 0 } };
    cell.planets.push(planet.planet);
    const bav = layers.ashtakavarga.rows.find((row: { planet: string }) => row.planet === planet.planet);
    if (bav) cell.bav[planet.planet] = bav.bindus[house - 1] ?? 0;
    const active = layers.dasha.active as any;
    if (active) {
      const activeLords = [active.mahadasha?.lord, active.antardasha?.lord, active.pratyantardasha?.lord];
      const index = activeLords.indexOf(planet.planet);
      if (index >= 0) {
        if (index === 0) cell.dasha.mahadasha = planet.planet;
        if (index === 1) cell.dasha.antardasha = planet.planet;
        if (index === 2) cell.dasha.pratyantardasha = planet.planet;
        cell.dasha.activation += [1, 0.7, 0.4][index] ?? 0;
      }
    }
    cells.set(key, cell);
    const entry = mansionMap.get(planet.nakshatra) ?? { houses: new Set<number>(), planets: new Set<string>(), activation: 0 };
    entry.houses.add(house);
    entry.planets.add(planet.planet);
    entry.activation += cell.dasha.activation;
    mansionMap.set(planet.nakshatra, entry);
  }
  for (const spectrum of layers.harmonics.spectrum) {
    for (const pair of spectrum.pairs) {
      if (pair.resonance <= 0) continue;
      const left = prediction.planets.find((planet) => planet.planet === pair.planetA);
      if (!left) continue;
      const cell = cells.get(`${left.nakshatra}:${left.house}`);
      if (cell) cell.harmonics[`H${spectrum.harmonic}`] = Math.max(cell.harmonics[`H${spectrum.harmonic}`] ?? 0, pair.resonance);
    }
  }
  const cellList = Array.from(cells.values());
  const strongestPatterns = cellList.map((cell) => {
    const harmonicStrength = Object.values(cell.harmonics).reduce((sum: number, value: number) => sum + value, 0);
    const bavStrength = Object.values(cell.bav).reduce((sum: number, value: number) => sum + value, 0);
    const strength = cell.sav + bavStrength + harmonicStrength * 10 + cell.dasha.activation * 10;
    const reasons = [`SAV ${cell.sav}`];
    if (bavStrength) reasons.push(`BAV support ${bavStrength}`);
    if (harmonicStrength) reasons.push(`harmonic resonance ${harmonicStrength.toFixed(2)}`);
    if (cell.dasha.activation) reasons.push(`Dasha activation ${cell.dasha.activation.toFixed(1)}`);
    return { mansion: cell.mansion, house: cell.house, strength: Number(strength.toFixed(3)), reasons };
  }).sort((a, b) => b.strength - a.strength).slice(0, 10);
  return {
    houses: Array.from({ length: 12 }, (_, index) => { const house = index + 1; const housePlanets = planetsByHouse.get(house) ?? []; return { house, sign: prediction.houses[index]?.sign ?? "Unknown", sav: houseSav(layers, house), planets: housePlanets.map((planet) => planet.planet), mansion: housePlanets[0]?.nakshatra ?? null }; }),
    mansions: Array.from(mansionMap.entries()).map(([mansion, entry]) => ({ mansion, houses: Array.from(entry.houses).sort((a, b) => a - b), planets: Array.from(entry.planets), activation: Number(entry.activation.toFixed(3)) })),
    cells: cellList,
    strongestPatterns,
    layers,
  };
}
export function getHouseAnalysis(graph: ChartEvidenceGraph, house: number) { return { house: graph.houses.find((entry) => entry.house === house), cells: graph.cells.filter((cell) => cell.house === house) }; }
export function getMansionAnalysis(graph: ChartEvidenceGraph, mansion: string) { return { mansion: graph.mansions.find((entry) => entry.mansion.toLowerCase() === mansion.toLowerCase()), cells: graph.cells.filter((cell) => cell.mansion.toLowerCase() === mansion.toLowerCase()) }; }
export function getCurrentDasha(graph: ChartEvidenceGraph) { return graph.layers.dasha.active; }
export function getStrongestPatterns(graph: ChartEvidenceGraph) { return graph.strongestPatterns; }
