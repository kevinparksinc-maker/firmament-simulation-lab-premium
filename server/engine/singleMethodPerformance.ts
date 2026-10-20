import type { SingleMethodEventResult } from "./isolatedMethodRunner";

function wilson95(hits: number, trials: number): [number, number] | null {
  if (!trials) return null;
  const z = 1.96, p = hits / trials, d = 1 + z * z / trials;
  const midpoint = (p + z * z / (2 * trials)) / d;
  const half = z * Math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / d;
  return [Number((100 * (midpoint - half)).toFixed(2)), Number((100 * (midpoint + half)).toFixed(2))];
}

/** Streaming statistics for ONE method over a historical fixture set.
 * Equal scores preserve actual A and B; no-triggers are NOT treated as ties.
 */
export function createSingleMethodAccumulator(methodId: string) {
  let games = 0, skippedUnverified = 0, researchEligible = 0, sourceVerified = 0;
  let hits = 0, misses = 0, equalScoreResults = 0, noTriggers = 0, notEvaluable = 0;
  let noActual = 0, historicalFavoritesCorrect = 0;
  let rawEqualA = 0, rawEqualB = 0, rawEqualCount = 0;
  let godA = 0, godB = 0, agentA = 0, agentB = 0, godScored = 0, agentScored = 0;
  const statuses: Record<string, number> = {};
  return {
    observe(record: SingleMethodEventResult) {
      if (record.methodId !== methodId) throw new Error("A one-method experiment cannot silently combine methods.");
      games++;
      statuses[record.frameMethodStatus] = (statuses[record.frameMethodStatus] ?? 0) + 1;
      if (record.god.scoreA !== null && record.god.scoreB !== null) { godA += record.god.scoreA; godB += record.god.scoreB; godScored++; }
      if (record.agent.scoreA !== null && record.agent.scoreB !== null) { agentA += record.agent.scoreA; agentB += record.agent.scoreB; agentScored++; }
      const actual = record.actualWinner;
      if (!actual || actual === "TIE") { noActual++; skippedUnverified++; return; }
      const sourceOK = record.event.roleAssignmentSource === "market-odds" && Boolean(record.event.oddsSource);
      if (!sourceOK) { skippedUnverified++; return; }
      sourceVerified++;
      if (record.frameMethodStatus !== "READY_FOR_EXPERIMENT") { notEvaluable++; return; }
      researchEligible++;
      if (actual === "A") historicalFavoritesCorrect++;
      const result = record.combined.result;
      if (result === "NO_QUALIFYING_CONDITION") { noTriggers++; return; }
      if (result === "EQUAL_SCORES") {
        equalScoreResults++;
        rawEqualA += record.combined.scoreA!;
        rawEqualB += record.combined.scoreB!;
        rawEqualCount++;
        return;
      }
      if (result !== "A" && result !== "B") { notEvaluable++; return; }
      if (result === actual) hits++; else misses++;
    },
    summary() {
      const directional = hits + misses;
      return {
        version: "ONE_METHOD_10000_RESEARCH_V1", methodId, games, sourceVerified, skippedUnverified, noActual,
        researchEligible, hits, misses, equalScoreResults, noTriggers, notEvaluable,
        coveragePercent: researchEligible ? Number((100 * directional / researchEligible).toFixed(2)) : null,
        directionalAccuracyPercent: directional ? Number((100 * hits / directional).toFixed(2)) : null,
        overallHitRatePercent: researchEligible ? Number((100 * hits / researchEligible).toFixed(2)) : null,
        confidence95Percent: wilson95(hits, directional),
        favoriteOnlyHitRatePercent: researchEligible ? Number((100 * historicalFavoritesCorrect / researchEligible).toFixed(2)) : null,
        scoreAverages: {
          godA: godScored ? Number((godA / godScored).toFixed(5)) : null,
          godB: godScored ? Number((godB / godScored).toFixed(5)) : null,
          agentA: agentScored ? Number((agentA / agentScored).toFixed(5)) : null,
          agentB: agentScored ? Number((agentB / agentScored).toFixed(5)) : null,
          equalScoresA: rawEqualCount ? Number((rawEqualA / rawEqualCount).toFixed(5)) : null,
          equalScoresB: rawEqualCount ? Number((rawEqualB / rawEqualCount).toFixed(5)) : null,
        },
        statuses,
        limitation: "One-method historical experimental analysis, not method certification. A supplied oddsSource label is not independent proof of point-in-time odds. Do not select/eliminate rules using the same dataset on which they are scored.",
      };
    },
  };
}
