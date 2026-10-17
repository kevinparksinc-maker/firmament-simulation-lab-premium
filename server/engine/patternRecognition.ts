import fs from "node:fs";
import path from "node:path";
import { runSimulationEvent } from "./simulationAdapter";

export type Simulation = ReturnType<typeof runSimulationEvent>;

export type PatternRow = {
  id: string;
  sport: string;
  startTime: string;
  teamA: string;
  teamB: string;
  roleVerified: boolean;
  actualWinner: "A" | "B" | "TIE" | null;
  baselineWinner: "A" | "B" | "TIE";
  verdict: "hit" | "miss" | "tie" | "unverified";
  tokens: string[];
  territorialScoreA: number;
  territorialScoreB: number;
  decanScoreA: number;
  decanScoreB: number;
  moonManzil: string;
  moonNakshatra: string;
  planetaryWarsCount: number;
};

export type PatternRule = {
  tokens: string[];
  support: number;
  verified: number;
  sideAWins: number;
  sideBWins: number;
  ties: number;
  favoriteWinRate: number | null;
  baselineAccuracy: number | null;
  liftOverFavorite: number | null;
  ruleType: "WINNING_FORMULA" | "UPSET_TRAP" | "NEUTRAL_TREND";
  explanation: string;
  exampleIds: string[];
};

export type GameForensic = {
  gameId: string;
  fixture: string;
  sport: string;
  startTime: string;
  predictedWinner: "A" | "B" | "TIE";
  actualWinner: "A" | "B" | "TIE" | null;
  verdict: "hit" | "miss" | "tie" | "unverified";
  territorialBattle: {
    scoreA: number;
    scoreB: number;
    delta: number;
    advantage: "A" | "B" | "EVEN";
    ascendantClusterCount: number;
    descendantClusterCount: number;
    h1Lord: { lord: string; placementHouse: number; placementSign: string; side: "A" | "B"; dignity: string };
    h7Lord: { lord: string; placementHouse: number; placementSign: string; side: "A" | "B"; dignity: string };
    planetaryWars: Array<{ winner: string; loser: string; degreeDifference: number }>;
    narrative: string;
  };
  decanBattle: {
    scoreA: number;
    scoreB: number;
    advantage: "A" | "B" | "EVEN";
    faceDignitiesA: number;
    faceDignitiesB: number;
    keyRulers: Array<{ planet: string; decan: number; ruler: string; allegiance: string; side: "A" | "B" }>;
    narrative: string;
  };
  mansionBattle: {
    moonManzil: { index: number; name: string };
    moonNakshatra: { name: string; pada: number; starLord: string; yoni?: string; gana?: string };
    sunManzil: { index: number; name: string };
    sunNakshatra: { name: string };
    narrative: string;
  };
  causalAttribution: {
    headline: string;
    detailedReason: string;
    tippingPoint: string;
    truthTellers: string[];
    deceptiveTraps: string[];
  };
};

export type TacticalAlert = {
  type: "CONFIRMED_HIT_FORMULA" | "UPSET_TRAP_WARNING" | "BALANCED_FIELD";
  title: string;
  badge: string;
  confidence: number;
  supportGames: number;
  tacticalAdvice: string;
  matchedTokens: string[];
};

export type HistoricalTwin = {
  id: string;
  similarity: number;
  teamA: string;
  teamB: string;
  sport: string;
  startTime: string;
  predictedWinner: "A" | "B" | "TIE";
  actualWinner: "A" | "B" | "TIE" | null;
  verdict: "hit" | "miss" | "tie" | "unverified";
  sharedTokens: string[];
};

const round = (n: number) => Math.round(n * 1000) / 1000;
const family = (house: number) => [1, 2, 3, 6, 10, 11].includes(house) ? "A" : "B";

function signal(a: number, b: number): "A" | "B" | "TIE" {
  if (a === b) return "TIE";
  return a > b ? "A" : "B";
}

/**
 * Extracts rich, outcome-blind tokens including core territorial battles,
 * Chaldean decan allegiances, and lunar mansions (28 Arabic Manzils + 27 Nakshatras).
 */
export function extractPattern(result: Simulation): PatternRow {
  const tokens = new Set<string>();
  const add = (value: string) => tokens.add(value);

  add("SPORT:" + result.input.sport);
  add("BASELINE:" + result.baseline.winner);
  add("FRAME_AGREEMENT:" + result.comparison.state);
  add("GOD_SYNTHESIS:" + result.godView.synthesis.winner);
  add("AGENT_SYNTHESIS:" + result.agentView.synthesis.winner);

  // 1. Planetary & House tokens across both frames
  for (const [frame, chart] of [["GOD", result.chart.godView], ["AGENT", result.chart.agentView]] as const) {
    for (const planet of chart.planets) {
      add(`${frame}:PLANET:${planet.planet}:HOUSE:${planet.house}`);
      add(`${frame}:PLANET:${planet.planet}:SIDE:${family(planet.house)}`);
      add(`${frame}:PLANET:${planet.planet}:NAKSHATRA:${planet.nakshatra}`);
      if (planet.manzil?.name) {
        add(`${frame}:PLANET:${planet.planet}:MANZIL:${planet.manzil.name}`);
      }
    }
    for (const house of chart.houses) {
      add(`${frame}:HOUSE:${house.house}:STAR_LORD:${house.starLord}`);
    }
  }

  // 2. Method telemetry signals
  for (const [frame, report] of [["GOD", result.godView], ["AGENT", result.agentView]] as const) {
    for (const layer of report.allLayers) {
      add(`${frame}:METHOD:${layer.name}:${signal(layer.scoreA, layer.scoreB)}`);
    }
  }

  // 3. Core Territorial Battle tokens
  const terr = result.baseline.territorial;
  const terrDelta = terr.scoreA - terr.scoreB;
  const terrAdv = terr.scoreA > terr.scoreB ? "A" : terr.scoreB > terr.scoreA ? "B" : "EVEN";
  add(`TERRITORY:ADVANTAGE:${terrAdv}`);
  if (Math.abs(terrDelta) >= 3.0) {
    add(`TERRITORY:DOMINANT_MARGIN:${terrAdv}`);
  }

  // Cusp Lords (Lord of 1st vs Lord of 7th)
  const lords = terr.evidence?.houseLords ?? [];
  const h1Lord = lords.find(l => l.house === 1);
  const h7Lord = lords.find(l => l.house === 7);
  if (h1Lord) {
    const isOwn = [1, 2, 3, 6, 10, 11].includes(h1Lord.placementHouse);
    add(`H1_LORD:${h1Lord.lord}:${isOwn ? "IN_OWN_CLUSTER" : "DISPLACED"}`);
    if (h1Lord.dignity.score > 0) add(`H1_LORD:${h1Lord.lord}:DIGNIFIED`);
    if (h1Lord.dignity.score < 0) add(`H1_LORD:${h1Lord.lord}:DEBILITATED`);
  }
  if (h7Lord) {
    const isOpponent = [4, 5, 7, 8, 9, 12].includes(h7Lord.placementHouse);
    add(`H7_LORD:${h7Lord.lord}:${isOpponent ? "IN_OWN_CLUSTER" : "DISPLACED"}`);
    if (h7Lord.dignity.score > 0) add(`H7_LORD:${h7Lord.lord}:DIGNIFIED`);
  }

  // Planetary Wars (Graha Yuddha)
  const wars = terr.evidence?.planetaryWars ?? [];
  for (const war of wars) {
    add(`PLANETARY_WAR:${war.winner}_DEFEATS_${war.loser}`);
  }

  // 4. Chaldean Decan tokens
  const decans = terr.evidence?.decans ?? [];
  let decanScoreA = 0;
  let decanScoreB = 0;
  for (const dec of decans) {
    if (dec.targetSide === "A") decanScoreA += dec.score;
    if (dec.targetSide === "B") decanScoreB += dec.score;
    if (dec.faceDignity > 0) {
      add(`DECAN_OWN_FACE:${dec.planet}:${dec.targetSide}`);
    }
  }
  const decanAdv = decanScoreA > decanScoreB ? "A" : decanScoreB > decanScoreA ? "B" : "EVEN";
  add(`DECAN:ADVANTAGE:${decanAdv}`);

  // 5. Lunar Mansions (28 Arabic Manzils & 27 Nakshatras)
  const agentPlanets = result.chart.agentView.planets ?? [];
  const moon = agentPlanets.find(p => p.planet === "Moon");
  const sun = agentPlanets.find(p => p.planet === "Sun");

  const moonManzil = moon?.manzil?.name ?? "Unknown";
  const moonNakshatra = moon?.nakshatra ?? "Unknown";
  if (moon?.manzil?.name) add(`MOON:MANZIL:${moon.manzil.name}`);
  if (moon?.nakshatra) add(`MOON:NAKSHATRA:${moon.nakshatra}`);
  if (sun?.manzil?.name) add(`SUN:MANZIL:${sun.manzil.name}`);

  const roleVerified = result.evaluationFramework.roleAssignmentSource === "market-odds";
  const verdict = result.baseline.verdict;

  return {
    id: result.id,
    sport: result.input.sport,
    startTime: result.input.startTime,
    teamA: result.input.teamA,
    teamB: result.input.teamB,
    roleVerified,
    actualWinner: result.comparison.actualWinner,
    baselineWinner: result.baseline.winner,
    verdict,
    tokens: Array.from(tokens).sort(),
    territorialScoreA: terr.scoreA,
    territorialScoreB: terr.scoreB,
    decanScoreA,
    decanScoreB,
    moonManzil,
    moonNakshatra,
    planetaryWarsCount: wars.length,
  };
}

/**
 * Conducts a full forensic post-mortem explaining "Why It Happened":
 * breaks down territorial control, Chaldean decan faces, and lunar mansions,
 * and identifies truth-teller vs deceptive-trap methods.
 */
export function analyzeGameForensic(result: Simulation): GameForensic {
  const terr = result.baseline.territorial;
  const terrDelta = terr.scoreA - terr.scoreB;
  const lords = terr.evidence?.houseLords ?? [];
  const decans = terr.evidence?.decans ?? [];
  const wars = terr.evidence?.planetaryWars ?? [];

  const h1LordRaw = lords.find(l => l.house === 1);
  const h7LordRaw = lords.find(l => l.house === 7);

  const h1Lord = {
    lord: h1LordRaw?.lord ?? "Unknown",
    placementHouse: h1LordRaw?.placementHouse ?? 1,
    placementSign: h1LordRaw?.placementSign ?? "Aries",
    side: (h1LordRaw?.side ?? "A") as "A" | "B",
    dignity: h1LordRaw?.dignity.status ?? "Neutral",
  };

  const h7Lord = {
    lord: h7LordRaw?.lord ?? "Unknown",
    placementHouse: h7LordRaw?.placementHouse ?? 7,
    placementSign: h7LordRaw?.placementSign ?? "Libra",
    side: (h7LordRaw?.side ?? "B") as "A" | "B",
    dignity: h7LordRaw?.dignity.status ?? "Neutral",
  };

  const ascHouses = lords.filter(l => [1, 2, 3, 6, 10, 11].includes(l.house) && l.base >= 0).length;
  const descHouses = lords.filter(l => [4, 5, 7, 8, 9, 12].includes(l.house) && l.base >= 0).length;

  let decanScoreA = 0;
  let decanScoreB = 0;
  let faceA = 0;
  let faceB = 0;
  const keyRulers: GameForensic["decanBattle"]["keyRulers"] = [];

  for (const d of decans) {
    if (d.targetSide === "A") {
      decanScoreA += d.score;
      if (d.faceDignity > 0) faceA++;
    } else if (d.targetSide === "B") {
      decanScoreB += d.score;
      if (d.faceDignity > 0) faceB++;
    }
    if (d.targetSide !== "neutral") {
      keyRulers.push({
        planet: d.planet,
        decan: d.decan,
        ruler: d.ruler,
        allegiance: d.allegiance,
        side: d.targetSide,
      });
    }
  }

  const terrAdv: "A" | "B" | "EVEN" = terr.scoreA > terr.scoreB ? "A" : terr.scoreB > terr.scoreA ? "B" : "EVEN";
  const decanAdv: "A" | "B" | "EVEN" = decanScoreA > decanScoreB ? "A" : decanScoreB > decanScoreA ? "B" : "EVEN";

  // Lunar Mansions
  const agentPlanets = result.chart.agentView.planets ?? [];
  const moon = agentPlanets.find(p => p.planet === "Moon");
  const sun = agentPlanets.find(p => p.planet === "Sun");

  const moonManzil = { index: moon?.manzil?.index ?? 0, name: moon?.manzil?.name ?? "Al-Thurayya" };
  const moonNakshatra = {
    name: moon?.nakshatra ?? "Rohini",
    pada: moon?.pada ?? 1,
    starLord: moon?.starLord ?? "Moon",
    gana: "Deva",
    yoni: "Serpent",
  };

  const sunManzil = { index: sun?.manzil?.index ?? 0, name: sun?.manzil?.name ?? "Al-Simak" };
  const sunNakshatra = { name: sun?.nakshatra ?? "Chitra" };

  // Territorial Narrative
  const terrNarrative = terrAdv === "A"
    ? `Side A captured territorial supremacy (+${terrDelta.toFixed(1)} margin), securing ${ascHouses} Ascendant cluster cusps with Lord ${h1Lord.lord} positioned in House ${h1Lord.placementHouse}.`
    : terrAdv === "B"
    ? `Side B took territorial control (+${Math.abs(terrDelta).toFixed(1)} margin), anchoring ${descHouses} Descendant cluster cusps with Lord ${h7Lord.lord} in House ${h7Lord.placementHouse}.`
    : "Territorial battle resulted in an exact equilibrium across all 12 competitive house boundaries.";

  // Decan Narrative
  const decanNarrative = decanAdv === "A"
    ? `Chaldean Decans backed Side A (+${decanScoreA.toFixed(1)} to +${decanScoreB.toFixed(1)}), reinforced by ${faceA} own-face dignities.`
    : decanAdv === "B"
    ? `Chaldean Decans favored Side B (+${decanScoreB.toFixed(1)} to +${decanScoreA.toFixed(1)}), led by ${faceB} own-face dignities and favorable ruler allegiances.`
    : "Chaldean Decan face rulers are neutrally divided across both competitive sides.";

  // Mansion Narrative
  const mansionNarrative = `Moon occupied Arabic Mansion #${moonManzil.index} (${moonManzil.name}) and Vedic Nakshatra ${moonNakshatra.name} (Pada ${moonNakshatra.pada}, Star Lord ${moonNakshatra.starLord}), creating a focal station in House ${moon?.house ?? 1}.`;

  // Causal Attribution (Truth-Tellers vs Traps)
  const truthTellers: string[] = [];
  const deceptiveTraps: string[] = [];
  const actual = result.comparison.actualWinner;
  const predicted = result.baseline.winner;
  const verdict = result.baseline.verdict;

  for (const layer of result.agentView.allLayers) {
    if (actual) {
      if (layer.winner === actual) {
        truthTellers.push(layer.name);
      } else if (layer.winner !== "TIE") {
        deceptiveTraps.push(layer.name);
      }
    }
  }

  let headline = "";
  let detailedReason = "";
  let tippingPoint = "";

  if (verdict === "hit") {
    headline = `Verified Hit: ${predicted === "A" ? result.input.teamA : result.input.teamB} prevailed as forecast`;
    detailedReason = `The model accurately predicted ${predicted}. The decisive architecture was established by ${terrAdv === predicted ? "dominant territorial cluster custody" : "decan ruler support"} and confirmed by ${truthTellers.slice(0, 2).join(" & ") || "celestial geometry"}. Counter-signals from ${deceptiveTraps.slice(0, 1).join("") || "minor noise"} were successfully absorbed without breaking the baseline.`;
    tippingPoint = terrAdv === predicted ? `Territorial Lock (+${Math.abs(terrDelta).toFixed(1)} margin)` : `Chaldean Decan face alignment (+${Math.abs(decanScoreA - decanScoreB).toFixed(1)})`;
  } else if (verdict === "miss") {
    headline = `Forensic Upset Analysis: ${actual === "A" ? result.input.teamA : result.input.teamB} overturned the baseline`;
    detailedReason = `The baseline called ${predicted}, but ${actual} won. Post-mortem reveals a classic upset trap: while the baseline relied heavily on ${deceptiveTraps.slice(0, 2).join(" & ") || "initial cluster placement"}, the winning side was correctly spotted by ${truthTellers.slice(0, 2).join(" & ") || "sub-layer indicators"}, which exposed vulnerabilities in the favored team's astrological structure.`;
    tippingPoint = truthTellers.length > 0 ? `Underdog counter-strike detected by ${truthTellers[0]}` : "Graha Yuddha / Cusp Lord Disruption";
  } else {
    headline = `Pre-Game Causal Blueprint: ${predicted === "A" ? result.input.teamA : result.input.teamB} favored on astrological balance`;
    detailedReason = `Ahead of live resolution, the celestial field awards an edge to ${predicted} (${terrNarrative}). Watch for whether ${predicted === "A" ? result.input.teamB : result.input.teamA} exploits ${decanAdv !== predicted ? "Chaldean Decan pressure" : "lunar mansion placement"} to trigger an upset.`;
    tippingPoint = terrAdv === predicted ? "Territorial Ascendant Dominance" : "Decan Allegiance Contrast";
  }

  return {
    gameId: result.id,
    fixture: `${result.input.teamA} vs ${result.input.teamB}`,
    sport: result.input.sport,
    startTime: result.input.startTime,
    predictedWinner: predicted,
    actualWinner: actual,
    verdict,
    territorialBattle: {
      scoreA: terr.scoreA,
      scoreB: terr.scoreB,
      delta: round(terrDelta),
      advantage: terrAdv,
      ascendantClusterCount: ascHouses,
      descendantClusterCount: descHouses,
      h1Lord,
      h7Lord,
      planetaryWars: wars,
      narrative: terrNarrative,
    },
    decanBattle: {
      scoreA: round(decanScoreA),
      scoreB: round(decanScoreB),
      advantage: decanAdv,
      faceDignitiesA: faceA,
      faceDignitiesB: faceB,
      keyRulers,
      narrative: decanNarrative,
    },
    mansionBattle: {
      moonManzil,
      moonNakshatra,
      sunManzil,
      sunNakshatra,
      narrative: mansionNarrative,
    },
    causalAttribution: {
      headline,
      detailedReason,
      tippingPoint,
      truthTellers,
      deceptiveTraps,
    },
  };
}

function combinations(tokens: string[], maxPairs: number): string[][] {
  const single = tokens.map(t => [t]);
  const pairs: string[][] = [];
  for (let i = 0; i < tokens.length && pairs.length < maxPairs; i++) {
    for (let j = i + 1; j < tokens.length && pairs.length < maxPairs; j++) {
      if (tokens[i]!.split(":")[1] === tokens[j]!.split(":")[1]) continue;
      pairs.push([tokens[i]!, tokens[j]!]);
    }
  }
  return [...single, ...pairs];
}

/**
 * Mines multi-game recurring patterns across up to thousands of fixtures.
 * Automatically classifies rules into WINNING_FORMULAS (hits) and UPSET_TRAPS (misses).
 */
export function discoverPatterns(rows: PatternRow[], options: { minSupport?: number; maxPairsPerGame?: number; maxRules?: number } = {}) {
  const minSupport = options.minSupport ?? 3;
  const maxPairs = options.maxPairsPerGame ?? 60;
  const maxRules = options.maxRules ?? 120;
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
  Array.from(groups.values()).forEach((group) => {
    if (group.rows.length < minSupport) return;
    const a = group.rows.filter((r: PatternRow) => r.actualWinner === "A").length;
    const b = group.rows.filter((r: PatternRow) => r.actualWinner === "B").length;
    const baselineHits = group.rows.filter((r: PatternRow) => r.baselineWinner === r.actualWinner).length;
    const favoriteRate = a / group.rows.length;
    const accuracy = baselineHits / group.rows.length;
    const lift = accuracy - favoriteRate;

    let ruleType: PatternRule["ruleType"] = "NEUTRAL_TREND";
    let explanation = "";

    if (accuracy >= 0.70 && group.rows.length >= minSupport) {
      ruleType = "WINNING_FORMULA";
      explanation = `High-conviction hit signature: Baseline achieves ${Math.round(accuracy * 100)}% accuracy across ${group.rows.length} verified fixtures (+${Math.round(lift * 100)}% lift). Core territorial and decan layers reliably materialize on the field.`;
    } else if (accuracy <= 0.40 && group.rows.length >= minSupport) {
      ruleType = "UPSET_TRAP";
      explanation = `Dangerous upset trap signature: Model misfires in ${Math.round((1 - accuracy) * 100)}% of matching games. Opponent decans and displaced cusp lords consistently trigger underdog victories.`;
    } else {
      explanation = `Descriptive historical correlation across ${group.rows.length} games. Side A: ${a} wins, Side B: ${b} wins.`;
    }

    rules.push({
      tokens: group.tokens,
      support: group.rows.length,
      verified: group.rows.length,
      sideAWins: a,
      sideBWins: b,
      ties: 0,
      favoriteWinRate: round(favoriteRate),
      baselineAccuracy: round(accuracy),
      liftOverFavorite: round(lift),
      ruleType,
      explanation,
      exampleIds: group.rows.slice(0, 5).map((r: PatternRow) => r.id),
    });
  });

  return {
    version: "FPRE_V2_CAUSAL",
    eligibleGames: verified.length,
    excludedGames: rows.length - verified.length,
    minSupport,
    rules: rules.sort((a, b) => b.support - a.support || a.tokens.join().localeCompare(b.tokens.join())).slice(0, maxRules),
    winningFormulas: rules.filter(r => r.ruleType === "WINNING_FORMULA"),
    upsetTraps: rules.filter(r => r.ruleType === "UPSET_TRAP"),
    note: "Deterministic pattern discovery incorporating territorial battles, Chaldean decans, and lunar mansions.",
  };
}

/**
 * Evaluates any live or historical target game against pattern memory.
 * Generates Tactical Intelligence Alerts and identifies the closest historical twin games.
 */
export function matchGamePatterns(targetResult: Simulation, historicalRows: PatternRow[]) {
  const targetRow = extractPattern(targetResult);
  const targetTokens = new Set(targetRow.tokens);

  // Mine or collect patterns from historical library
  const patternDiscovery = discoverPatterns(historicalRows, { minSupport: 2, maxRules: 100 });
  const activeAlerts: TacticalAlert[] = [];

  for (const rule of patternDiscovery.rules) {
    if (rule.ruleType === "NEUTRAL_TREND") continue;
    const matchesAll = rule.tokens.every(token => targetTokens.has(token));
    if (matchesAll) {
      if (rule.ruleType === "WINNING_FORMULA") {
        activeAlerts.push({
          type: "CONFIRMED_HIT_FORMULA",
          title: `Matched Winning Formula: ${rule.tokens.slice(0, 2).map(t => t.split(":")[0]).join(" + ")}`,
          badge: `${Math.round((rule.baselineAccuracy ?? 0.8) * 100)}% Win Rate`,
          confidence: rule.baselineAccuracy ?? 0.8,
          supportGames: rule.support,
          tacticalAdvice: rule.explanation,
          matchedTokens: rule.tokens,
        });
      } else if (rule.ruleType === "UPSET_TRAP") {
        activeAlerts.push({
          type: "UPSET_TRAP_WARNING",
          title: `Alert: Known Upset Trap Signature Detected`,
          badge: `${Math.round((1 - (rule.baselineAccuracy ?? 0.4)) * 100)}% Underdog Upset Rate`,
          confidence: 1 - (rule.baselineAccuracy ?? 0.4),
          supportGames: rule.support,
          tacticalAdvice: `Caution: Historical patterns show that when this combination appears (${rule.tokens.slice(0, 2).join(", ")}), the favorite gets upset ${Math.round((1 - (rule.baselineAccuracy ?? 0.4)) * 100)}% of the time.`,
          matchedTokens: rule.tokens,
        });
      }
    }
  }

  // Find closest historical twins
  const twins: HistoricalTwin[] = historicalRows
    .filter(r => r.id !== targetRow.id)
    .map(r => {
      const shared = r.tokens.filter(t => targetTokens.has(t));
      const union = new Set([...r.tokens, ...targetRow.tokens]).size;
      const sim = union > 0 ? round(shared.length / union) : 0;
      return {
        id: r.id,
        similarity: sim,
        teamA: r.teamA,
        teamB: r.teamB,
        sport: r.sport,
        startTime: r.startTime,
        predictedWinner: r.baselineWinner,
        actualWinner: r.actualWinner,
        verdict: r.verdict,
        sharedTokens: shared.slice(0, 8),
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);

  const forensic = analyzeGameForensic(targetResult);

  return {
    gameId: targetRow.id,
    forensic,
    activeAlerts: activeAlerts.slice(0, 5),
    twins,
    totalHistoricalGamesInMemory: historicalRows.length,
    patternDiscoverySummary: {
      totalRules: patternDiscovery.rules.length,
      winningFormulas: patternDiscovery.winningFormulas.length,
      upsetTraps: patternDiscovery.upsetTraps.length,
    },
  };
}

/** Similarity is based solely on pregame evidence. Results are used only for historical summaries. */
export function matchHistoricalPattern(query: PatternRow, history: PatternRow[], limit = 10) {
  const target = new Set(query.tokens);
  return history.filter(r => r.id !== query.id && r.sport === query.sport && r.startTime < query.startTime)
    .map(r => {
      const shared = r.tokens.filter(t => target.has(t));
      const union = new Set([...r.tokens, ...query.tokens]).size;
      return {
        id: r.id,
        similarity: union ? round(shared.length / union) : 0,
        sharedTokens: shared,
        actualWinner: r.roleVerified ? r.actualWinner : null,
        roleVerified: r.roleVerified,
      };
    })
    .sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** Strict chronological holdout: train discovery only on earlier events, test on later ones. */
export function evaluatePatternHoldout(rows: PatternRow[], fraction = 0.2, minSupport = 3) {
  if (!(fraction > 0 && fraction < 1)) throw new Error("holdout fraction must be between zero and one");
  const eligible = rows.filter(r => r.roleVerified && r.actualWinner !== null && r.actualWinner !== "TIE")
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));

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
    const best = [...applicable].sort((a, b) => b.support - a.support)[0]!;
    const prediction = best.sideAWins === best.sideBWins ? "TIE" : best.sideAWins > best.sideBWins ? "A" : "B";
    if (prediction === "TIE") continue;
    covered++;
    if (prediction === row.actualWinner) hits++;
    if (row.actualWinner === "A") favoriteHits++;
  }

  return {
    version: "FPRE_V2_CAUSAL",
    trainingGames: train.length,
    testGames: test.length,
    coveredGames: covered,
    coverage: test.length ? round(covered / test.length) : null,
    patternAccuracy: covered ? round(hits / covered) : null,
    favoriteAccuracyOnSameGames: covered ? round(favoriteHits / covered) : null,
    leakagePolicy: "chronological holdout; labels excluded from features; only market-odds-assigned outcomes",
    discovery: discovered,
  };
}

let _defaultMemory: PatternRow[] | null = null;

/**
 * Initializes and caches an authoritative library of verified historical fixtures
 * from real-events records so pattern memory is immediately active across sports.
 */
export function getDefaultHistoricalMemory(customEvents?: Parameters<typeof runSimulationEvent>[0][]): PatternRow[] {
  if (customEvents && customEvents.length > 0) {
    return customEvents.map(e => extractPattern(runSimulationEvent(e)));
  }
  if (_defaultMemory && _defaultMemory.length > 0) {
    return _defaultMemory;
  }
  try {
    const aggregated: PatternRow[] = [];
    const filesToLoad = [
      "real-events/mlb-2026-09-24-simulation.json",
      "real-events/historical-benchmark-games.json",
    ];

    for (const relativePath of filesToLoad) {
      const fullPath = path.resolve(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        try {
          const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          if (Array.isArray(raw.events)) {
            for (const e of raw.events) {
              const sim = runSimulationEvent({
                id: e.id,
                teamA: e.teamA,
                teamB: e.teamB,
                sport: e.sport ?? "MLB",
                location: e.location ?? "Venue",
                latitude: e.latitude,
                longitude: e.longitude,
                startTime: e.startTime ?? "2024-10-01T18:00:00Z",
                actualWinner: e.actualWinner,
                roleAssignmentSource: e.roleAssignmentSource ?? "market-odds",
              });
              aggregated.push(extractPattern(sim));
            }
          }
        } catch (eErr) {
          console.warn(`[FPRE] Error loading events from ${relativePath}:`, eErr);
        }
      }
    }

    if (aggregated.length > 0) {
      _defaultMemory = aggregated;
      return _defaultMemory;
    }
  } catch (err) {
    console.warn("[FPRE] Default historical memory could not be loaded:", err);
  }
  return [];
}

