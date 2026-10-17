import type { runSimulationEvent } from "./simulationAdapter";

/** FPRE v1: deterministic, explainable, outcome-blind feature extraction. */
export type Simulation = ReturnType<typeof runSimulationEvent>;
export type PatternRow = {
  id: string; sport: string; startTime: string; roleVerified: boolean;
  actualWinner: "A" | "B" | "TIE" | null; baselineWinner: "A" | "B" | "TIE";
  tokens: string[];
};
export type PatternRule = {
  tokens: string[]; support: number; verified: number;
  sideAWins: number; sideBWins: number; ties: number;
  favoriteWinRate: number | null; baselineAccuracy: number | null;
  liftOverFavorite: number | null; exampleIds: string[];
};
const round = (n: number) => Math.round(n * 1000) / 1000;
const family = (house: number) => [1, 2, 3, 6, 10, 11].includes(house) ? "A" : "B";
function signal(a: number, b: number): "A" | "B" | "TIE" {
  if (a === b) return "TIE";
  return a > b ? "A" : "B";
}
export function extractPattern(result: Simulation): PatternRow {
  const tokens = new Set<string>();
  const add = (value: string) => tokens.add(value);
  add("SPORT:" + result.input.sport);
  add("BASELINE:" + result.baseline.winner);
  add("FRAME_AGREEMENT:" + result.comparison.state);
  add("GOD_SYNTHESIS:" + result.godView.synthesis.winner);
  add("AGENT_SYNTHESIS:" + result.agentView.synthesis.winner);
  for (const [frame, chart] of [["GOD", result.chart.godView], ["AGENT", result.chart.agentView]] as const) {
    for (const planet of chart.planets) {
      add(frame + ":PLANET:" + planet.planet + ":HOUSE:" + planet.house);
      add(frame + ":PLANET:" + planet.planet + ":SIDE:" + family(planet.house));
      add(frame + ":PLANET:" + planet.planet + ":NAKSHATRA:" + planet.nakshatra);
    }
    for (const house of chart.houses) {
      add(frame + ":HOUSE:" + house.house + ":STAR_LORD:" + house.starLord);
    }
  }
  for (const [frame, report] of [["GOD", result.godView], ["AGENT", result.agentView]] as const) {
    for (const layer of report.allLayers) {
      add(frame + ":METHOD:" + layer.name + ":" + signal(layer.scoreA, layer.scoreB));
    }
  }
  return {
    id: result.id, sport: result.input.sport, startTime: result.input.startTime,
    roleVerified: result.evaluationFramework.roleAssignmentSource === "market-odds",
    actualWinner: result.comparison.actualWinner,
    baselineWinner: result.baseline.winner,
    tokens: Array.from(tokens).sort(),
  };
}
function combinations(tokens: string[], maxPairs: number): string[][] {
  const single = tokens.map(t => [t]);
  const pairs: string[][] = [];
  for (let i = 0; i < tokens.length && pairs.length < maxPairs; i++) {
    for (let j = i + 1; j < tokens.length && pairs.length < maxPairs; j++) {
      // Only cross-family pairs: avoid tautological planet/house duplicate features.
      if (tokens[i]!.split(":")[1] === tokens[j]!.split(":")[1]) continue;
      pairs.push([tokens[i]!, tokens[j]!]);
    }
  }
  return [...single, ...pairs];
}
/** Mine recurring signatures using only eligible historical results. Never learns from future games. */
export function discoverPatterns(rows: PatternRow[], options: { minSupport?: number; maxPairsPerGame?: number; maxRules?: number } = {}) {
  const minSupport = options.minSupport ?? 5;
  const maxPairs = options.maxPairsPerGame ?? 60;
  const maxRules = options.maxRules ?? 100;
  const verified = rows.filter(r => r.roleVerified && r.actualWinner !== null && r.actualWinner !== "TIE");
  const groups = new Map<string, { tokens: string[]; rows: PatternRow[] }>();
  for (const row of verified) {
    for (const tokens of combinations(row.tokens, maxPairs)) {
      const key = JSON.stringify(tokens);
      const group = groups.get(key) ?? { tokens, rows: [] };
      group.rows.push(row);
      groups.set(key, group);
    }
  }
  const rules: PatternRule[] = [];
  for (const group of Array.from(groups.values())) {
    if (group.rows.length < minSupport) continue;
    const a = group.rows.filter(r => r.actualWinner === "A").length;
    const b = group.rows.filter(r => r.actualWinner === "B").length;
    const baselineHits = group.rows.filter(r => r.baselineWinner === r.actualWinner).length;
    const rate = a / group.rows.length;
    const baselineRate = baselineHits / group.rows.length;
    rules.push({
      tokens: group.tokens, support: group.rows.length, verified: group.rows.length,
      sideAWins: a, sideBWins: b, ties: 0,
      favoriteWinRate: round(rate), baselineAccuracy: round(baselineRate),
      liftOverFavorite: round(baselineRate - rate),
      exampleIds: group.rows.slice(0, 5).map(r => r.id),
    });
  }
  return {
    version: "FPRE_V1", eligibleGames: verified.length, excludedGames: rows.length - verified.length,
    minSupport, rules: rules.sort((a,b) => b.support - a.support || a.tokens.join().localeCompare(b.tokens.join())).slice(0,maxRules),
    note: "Descriptive associations only; not causal evidence or a calibrated betting forecast.",
  };
}
/** Similarity is based solely on pregame evidence. Results are used only for historical summaries. */
export function matchHistoricalPattern(query: PatternRow, history: PatternRow[], limit = 10) {
  const target = new Set(query.tokens);
  return history.filter(r => r.id !== query.id && r.sport === query.sport && r.startTime < query.startTime)
    .map(r => {
      const shared = r.tokens.filter(t => target.has(t));
      const union = new Set([...r.tokens, ...query.tokens]).size;
      return { id: r.id, similarity: union ? round(shared.length / union) : 0, sharedTokens: shared, actualWinner: r.roleVerified ? r.actualWinner : null, roleVerified: r.roleVerified };
    })
    .sort((a,b) => b.similarity - a.similarity || a.id.localeCompare(b.id)).slice(0,limit);
}
/** Strict chronological holdout: train discovery only on earlier events, test on later ones. */
export function evaluatePatternHoldout(rows: PatternRow[], fraction = 0.2, minSupport = 5) {
  if (!(fraction > 0 && fraction < 1)) throw new Error("holdout fraction must be between zero and one");
  const eligible = rows.filter(r => r.roleVerified && r.actualWinner !== null && r.actualWinner !== "TIE")
    .sort((a,b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
  const cutoff = Math.floor(eligible.length * (1 - fraction));
  const train = eligible.slice(0, cutoff);
  const test = eligible.slice(cutoff);
  const discovered = discoverPatterns(train, { minSupport });
  const rules = discovered.rules.filter(rule => !rule.tokens.some(t => t.startsWith("SPORT:")));
  let covered = 0, hits = 0, favoriteHits = 0;
  for (const row of test) {
    const set = new Set(row.tokens);
    const applicable = rules.filter(rule => rule.tokens.every(t => set.has(t)));
    if (!applicable.length) continue;
    // The outcome of a held-out game is never used to choose its matched rule.
    const best = [...applicable].sort((a,b) => b.support - a.support)[0]!;
    const prediction = best.sideAWins === best.sideBWins ? "TIE" : best.sideAWins > best.sideBWins ? "A" : "B";
    if (prediction === "TIE") continue;
    covered++;
    if (prediction === row.actualWinner) hits++;
    if (row.actualWinner === "A") favoriteHits++;
  }
  return {
    version: "FPRE_V1", trainingGames: train.length, testGames: test.length,
    coveredGames: covered, coverage: test.length ? round(covered / test.length) : null,
    patternAccuracy: covered ? round(hits / covered) : null,
    favoriteAccuracyOnSameGames: covered ? round(favoriteHits / covered) : null,
    leakagePolicy: "chronological holdout; labels excluded from features; only market-odds-assigned outcomes",
    discovery: discovered,
  };
}
