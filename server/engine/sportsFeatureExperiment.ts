import { runSimulationEvent, type SimulationEventInput } from "./simulationAdapter";

export const SPORTS_FEATURE_EXPERIMENT_RULES = Object.freeze({
  orb: 5,
  weightScale: "0°=5, 1°=4, 2°=3, 3°=2, 4–5°=1",
  sideHouses: { A: [1, 2, 3, 6, 10, 11], B: [4, 5, 7, 8, 9, 12] },
  featureNormalization: "weighted side differential divided by relationship count, then scaled by 5",
  noCallOnExactTie: true,
});

type Variant = "baseline" | "manzil" | "nakshatra" | "combined";
const sideForHouse = (house: number): "A" | "B" | null => SPORTS_FEATURE_EXPERIMENT_RULES.sideHouses.A.includes(house) ? "A" : SPORTS_FEATURE_EXPERIMENT_RULES.sideHouses.B.includes(house) ? "B" : null;

function featureSignal(result: ReturnType<typeof runSimulationEvent>, kind: "manzil" | "nakshatra") {
  const rows = kind === "manzil" ? result.chart.celestialGeometry.planetManzilAspects : result.chart.celestialGeometry.planetNakshatraAspects;
  let sideA = 0;
  let sideB = 0;
  for (const row of rows) {
    const planet = result.chart.agentView.planets.find((candidate: any) => candidate.planet === row.source);
    const side = planet ? sideForHouse(planet.house) : null;
    if (side === "A") sideA += row.weight;
    if (side === "B") sideB += row.weight;
  }
  const differential = rows.length ? ((sideA - sideB) / rows.length) * 5 : 0;
  return { sideA: Number(sideA.toFixed(4)), sideB: Number(sideB.toFixed(4)), relationshipCount: rows.length, normalizedDifferential: Number(differential.toFixed(4)) };
}

function resolveVariant(result: ReturnType<typeof runSimulationEvent>, variant: Variant, manzil: ReturnType<typeof featureSignal>, nakshatra: ReturnType<typeof featureSignal>) {
  if (variant === "baseline") return { winner: result.baseline.winner, scoreA: result.baseline.combined.scoreA, scoreB: result.baseline.combined.scoreB };
  const manzilAdjustment = variant === "manzil" || variant === "combined" ? manzil.normalizedDifferential : 0;
  const nakshatraAdjustment = variant === "nakshatra" || variant === "combined" ? nakshatra.normalizedDifferential : 0;
  const scoreA = result.baseline.combined.scoreA + Math.max(0, manzilAdjustment) + Math.max(0, nakshatraAdjustment);
  const scoreB = result.baseline.combined.scoreB + Math.max(0, -manzilAdjustment) + Math.max(0, -nakshatraAdjustment);
  return { winner: scoreA === scoreB ? "TIE" as const : scoreA > scoreB ? "A" as const : "B" as const, scoreA: Number(scoreA.toFixed(4)), scoreB: Number(scoreB.toFixed(4)) };
}

export function runSportsFeatureExperiment(events: SimulationEventInput[]) {
  const variants: Variant[] = ["baseline", "manzil", "nakshatra", "combined"];
  const rows = events.map((input) => {
    const result = runSimulationEvent(input);
    const manzil = featureSignal(result, "manzil");
    const nakshatra = featureSignal(result, "nakshatra");
    const predictions = Object.fromEntries(variants.map((variant) => [variant, resolveVariant(result, variant, manzil, nakshatra)])) as Record<Variant, ReturnType<typeof resolveVariant>>;
    return { id: result.id, event: result.input, actualWinner: result.comparison.actualWinner, signals: { manzil, nakshatra }, predictions };
  });
  const summary = Object.fromEntries(variants.map((variant) => {
    const verified = rows.filter((row) => row.actualWinner);
    const hits = verified.filter((row) => row.predictions[variant].winner === row.actualWinner).length;
    const ties = verified.filter((row) => row.predictions[variant].winner === "TIE").length;
    return [variant, { total: rows.length, verified: verified.length, hits, misses: verified.length - hits - ties, ties, accuracy: verified.length ? Number((hits / verified.length * 100).toFixed(1)) : null, changedFromBaseline: variant === "baseline" ? 0 : rows.filter((row) => row.predictions[variant].winner !== row.predictions.baseline.winner).length }];
  })) as Record<Variant, { total: number; verified: number; hits: number; misses: number; ties: number; accuracy: number | null; changedFromBaseline: number }>;
  return { rules: SPORTS_FEATURE_EXPERIMENT_RULES, variants, summary, rows };
}
