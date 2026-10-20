import type { runSimulationEvent } from "./simulationAdapter";

type Simulation = ReturnType<typeof runSimulationEvent>;
type Winner = "A" | "B" | "TIE";
type MethodCounter = {
  id: string; name: string; family: string; source: string;
  observed: number; included: number; excluded: number; hits: number; misses: number; ties: number;
  abstentions: number; changedWinnerWhenRemoved: number;
  correctedWinnerWhenRemoved: number; worsenedWinnerWhenRemoved: number;
  exclusionReasons: Record<string, number>;
};
const empty = (id: string, name: string, family: string, source: string): MethodCounter => ({
  id, name, family, source, observed: 0, included: 0, excluded: 0, hits: 0,
  misses: 0, ties: 0, abstentions: 0, changedWinnerWhenRemoved: 0,
  correctedWinnerWhenRemoved: 0, worsenedWinnerWhenRemoved: 0, exclusionReasons: {},
});
const pick = (a: number, b: number): Winner => a === b ? "TIE" : a > b ? "A" : "B";
function wilson95(hits: number, trials: number): [number, number] | null {
  if (!trials) return null;
  const z = 1.96, p = hits / trials, d = 1 + z * z / trials;
  const center = (p + z * z / (2 * trials)) / d;
  const radius = z * Math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / d;
  return [Number((100 * Math.max(0, center - radius)).toFixed(2)), Number((100 * Math.min(1, center + radius)).toFixed(2))];
}

/** Online per-method tracking: intended for up to 10,000 saved fixtures.
 * Scores only prospective-style, sourced favorite/underdog labels with an A/B
 * final result. Filename or teamA alone is NEVER market-odds proof.
 */
export function createMethodPerformanceAccumulator() {
  const byId = new Map<string, MethodCounter>();
  let processed = 0, withActualWinner = 0, researchEligible = 0;
  let favoriteHits = 0, originalHits = 0, originalMisses = 0, originalTies = 0;
  let expandedHits = 0, expandedMisses = 0, expandedTies = 0;
  let expandedInvalid = 0;
  return {
    observe(result: Simulation) {
      processed++;
      if (result.comparison.actualWinner === "A" || result.comparison.actualWinner === "B") withActualWinner++;
      const eligible = result.comparison.actualWinner !== null &&
        result.comparison.actualWinner !== "TIE" &&
        result.evaluationFramework.roleAssignmentSource === "market-odds" &&
        result.expandedExperiment.valid;
      if (eligible) {
        researchEligible++;
        const actual = result.comparison.actualWinner!;
        if (actual === "A") favoriteHits++;
        if (result.synthesisView.winner === "TIE") originalTies++;
        else if (result.synthesisView.winner === actual) originalHits++;
        else originalMisses++;
        if (result.expandedExperiment.winner === "TIE") expandedTies++;
        else if (result.expandedExperiment.winner === actual) expandedHits++;
        else expandedMisses++;
      }
      if (!result.expandedExperiment.valid) expandedInvalid++;
      for (const method of result.expandedExperiment.methods) {
        let counter = byId.get(method.id);
        if (!counter) { counter = empty(method.id, method.name, method.family, method.source); byId.set(method.id, counter); }
        counter.observed++;
        if (method.counted) counter.included++; else {
          counter.excluded++;
          counter.exclusionReasons[method.status] = (counter.exclusionReasons[method.status] ?? 0) + 1;
        }
        if (!eligible) continue;
        if (!method.counted) { counter.abstentions++; continue; }
        if (method.prediction === "TIE") { counter.ties++; continue; }
        if (method.prediction === "NONE") { counter.abstentions++; continue; }
        const actual = result.comparison.actualWinner!;
        if (method.prediction === actual) counter.hits++; else counter.misses++;
        const withoutA = result.expandedExperiment.voteA - (method.vote === 1 ? 1 : 0);
        const withoutB = result.expandedExperiment.voteB - (method.vote === -1 ? 1 : 0);
        const without = pick(withoutA, withoutB), withMethod = result.expandedExperiment.winner;
        if (without !== withMethod) {
          counter.changedWinnerWhenRemoved++;
          if (without === actual && withMethod !== actual) counter.correctedWinnerWhenRemoved++;
          if (withMethod === actual && without !== actual) counter.worsenedWinnerWhenRemoved++;
        }
      }
    },
    summary() {
      return {
        version: "METHOD_PERFORMANCE_V1",
        processed, withActualWinner, researchEligible,
        excludedFromResearch: processed - researchEligible, expandedInvalid,
        eligibilityRule: "Requires an A/B actual result, source-labelled market-odds favorite mapped to Side A, and valid expanded method parity. A source label is an assertion; independent odds/kickoff provenance still needs audit.",
        baseline: {
          favoriteOnly: { hits: favoriteHits, sample: researchEligible, hitRatePercent: researchEligible ? Number((100 * favoriteHits / researchEligible).toFixed(2)) : null },
          core21: { hits: originalHits, misses: originalMisses, ties: originalTies, directionalAccuracyPercent: originalHits + originalMisses ? Number((100 * originalHits / (originalHits + originalMisses)).toFixed(2)) : null },
          expanded31Research: { hits: expandedHits, misses: expandedMisses, ties: expandedTies, directionalAccuracyPercent: expandedHits + expandedMisses ? Number((100 * expandedHits / (expandedHits + expandedMisses)).toFixed(2)) : null },
        },
        methods: [...byId.values()].map(counter => ({
          ...counter,
          directionalAccuracyPercent: counter.hits + counter.misses ? Number((100 * counter.hits / (counter.hits + counter.misses)).toFixed(2)) : null,
          confidence95Percent: wilson95(counter.hits, counter.hits + counter.misses),
        })),
        decisionWarning: "Research only. One 10,000-game sample does not certify rules or causality. Remove or quarantine methods only after source verification, point-in-time odds validation, preregistered scoring, held-out seasons, coverage and uncertainty checks. Ablation measures the changed 31-vote model, not independent contribution.",
      };
    },
  };
}
