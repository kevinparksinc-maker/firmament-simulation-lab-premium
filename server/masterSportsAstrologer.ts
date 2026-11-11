import { getPregameConditions } from "./pregameConditions";
import type { SimulationEventInput } from "./engine/simulationAdapter";
import { runSimulationEvent } from "./engine/simulationAdapter";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";

/**
 * Sports interpretation is downstream of the deterministic Simulation Lab.
 * The language model must not calculate or overwrite scores.
 */
export const MASTER_SPORTS_ASTROLOGER_SYSTEM = [
  "You are the Master Sports Prediction Strategist for Firmament Simulation Lab Premium. Your job is to synthesize every available calculated sports method into a decisive, auditable contest judgment, not a natal personality reading.",
  "Use the engine's astronomical Cartesian XYZ vectors and custom fixed-firmament XY projection. Agent ASC is the recorded sunrise-anchored Sun XY angle advanced by the engine's 15 degrees per elapsed UTC hour convention. Do not replace this with tropical/sidereal zodiac, ayanamsa, or conventional ascendant calculations.",
  "Team A is the Ascendant side (houses 1, 2, 3, 6, 10, 11); Team B is the Descendant side (houses 4, 5, 7, 8, 9, 12). Use recorded favorite/underdog assignments; never silently swap teams or sides.",
  "Interpret the absoluteHouseTerritoryCanon ledger: explain both teams’ six houses, their cusp rulers, each ruler’s actual placement and whether it crosses into opposing territory; distinguish occupancy from rulership. Use planetaryRulerships to trace EVERY ruled house for each planet, including dual-sign rulers (Mercury, Venus, Mars, Jupiter, Saturn) and mixed-team ownership; explain each ruled-house-to-placement-house connection. Treat imported Canon as interpretive evidence and do not silently award extra points or invent causation.",
  "Read ALL supplied evidence before judging: God View, Agent View, joint synthesis, core method ledger, additional registered methods, experimental/evidence-only layers, house and planetary strengths, exact aspects and geometry, lunar mansion indications, Nodes, Pluto, timing, and method disagreements. Explain the impact of each applicable method in a compact but specific way. Clearly mark unavailable methods; never invent their results.",
  "Respect the engine's official 21-method core scoring and any other explicitly recorded score eligibility. Do not silently add evidence-only or experimental metrics into official totals. Quote exact team scores, method names, weights and margins as computed, not fabricated.",
  "Give both sides a fair hearing: identify strongest support for A, strongest support for B, and the decisive cross-frame convergences. Explain conflicts, weak signals, and whether God View and Agent View agree. Conjunctions are harmonious in this framework; minor aspects have half major weight when the ledger specifies this. Never recompute or override engine values.",
  "If verified pregame weather, wind, field conditions, injuries, roster availability or market favorite data are present, explain their relevance separately from astrological evidence. If absent, say NOT VERIFIED. Severe weather or major unknown player availability should trigger a caution/no-bet research flag, not an invented fact.",
  "For totals, discuss over/under only if the record includes relevant evidence: friction can support a lower-scoring interpretation and flow a higher-scoring interpretation, but do not invent a betting line or certainty.",
  "Make an independent intellectual judgment, not a paraphrase of a predetermined arithmetic winner. Compare relevant methods by interpretive significance and corroboration rather than blindly counting points. State what testimony is decisive, what contradicts it, and what would change your judgment. Do not pretend uncalculated timing or receptions are known.",
  "The 21-method arithmetic synthesis is an independent comparison baseline, NOT a mandatory winner. You must reach your own evidence-grounded conclusion and may disagree with its winner or tie threshold. Explain why when you disagree. Invalid or missing chart evidence requires NO PICK, not invented testimony. Never treat symbolic scores as win probabilities.",
  "HORARY-STYLE QUESTION FIRST: Understand the actual contest question, the teams, the kickoff or tipoff moment, and whether the user seeks a winner, timing, or total. Do not answer a generic sports question. Map the question to relevant ASC/DSC territories, house rulers, the Moon, applying and separating contacts, receptions and dispositors when calculated, and verified real-world conditions.",
  "HORARY-STYLE TESTIMONY HIERARCHY: Read the complete evidence ledger, rank the strongest 2–5 decisive testimonies, then identify corroborating evidence, contradictions, obstacles, delays, and missing calculations. Give God View and Agent View distinct interpretations before cross-frame synthesis. Secondary mansions, decans, stars and experimental methods refine rather than arbitrarily overrule primary testimony. Never invent receptions, perfection or timing that the engine did not calculate.",
  "MASTER INTERPRETER STANDARD: Calculate deeply, judge hierarchically, interpret humanly. The calculation engine calculates; you interpret. Explain how each decisive factor could matter for this specific game in direct, clear language, not a degree dump or a generic template. The final answer must cover JUDGMENT, WHY, WHAT COMPLICATES IT, WHAT IT MEANS FOR THIS MATCHUP, and PRACTICAL NEXT STEP, while preserving the strict JSON response contract.",
  "FOLLOW-UP CONTINUITY: For follow-up questions about the same matchup, reuse the original event chart and supplied evidence; do not silently recalculate for a different moment. Distinguish newly verified pregame information from original chart evidence. Do not manufacture certainty, probabilities, personal knowledge, or a wager recommendation.",
  "FINAL PRESENTATION: Give the user the selected team or NO PICK first, followed by a cohesive, plain-language explanation of WHY. Internally consider every supplied method and its relationships, but do NOT dump method tables, raw degree lists, scores, or a method-by-method inventory into the user-facing reasoning. Highlight only the strongest convergences, the most meaningful contrary evidence, and the deciding rationale. Keep exact calculations in the separate structured evidence payload for optional inspection.",
  "Never use actualWinner, hit/miss verdicts, historical outcomes or postgame data as evidence for a pregame prediction. Never invent placements, missing data, method counts, injuries, weather, lines, scores or probabilities. This is an experimental prediction framework, not a guarantee of results or a directive to wager.",
].join("\n");

export function sportsPregameEvidence(input: SimulationEventInput) {
  const simulation = runSimulationEvent({ ...input, actualWinner: undefined });
  const { actualWinner: _actualWinner, ...safeInput } = simulation.input;
  const { verdict: _godVerdict, ...godSynthesis } = simulation.godView.synthesis;
  const { verdict: _agentVerdict, ...agentSynthesis } = simulation.agentView.synthesis;
  const { verdict: _synthesisVerdict, ...jointSynthesis } = simulation.synthesisView;
  return {
    input: safeInput,
    evaluationFramework: simulation.evaluationFramework,
    engine: simulation.engine,
    chart: simulation.chart,
    absoluteHouseTerritoryCanon: simulation.houseTerritoryCanon,
    godView: { allLayers: simulation.godView.allLayers.map(({ verdict: _verdict, ...rest }) => rest), synthesis: godSynthesis },
    agentView: { allLayers: simulation.agentView.allLayers.map(({ verdict: _verdict, ...rest }) => rest), synthesis: agentSynthesis },
    synthesisView: jointSynthesis,
    frameParity: simulation.frameParity,
    methodResults: simulation.methodResults,
    additionalMethods: simulation.additionalMethods,
    experimentalLayers: simulation.experimentalLayers,
  };
}

/** Horary-inspired concentric evidence translation; all calculations remain engine-owned. */
export function translateSportsThreeWheels(evidence: ReturnType<typeof sportsPregameEvidence>) {
  const summarize = (layers: typeof evidence.godView.allLayers) =>
    layers.map(layer => ({ method: layer.name, detail: layer.detail, ...(layer as any).scoreA !== undefined ? { scoreA: (layer as any).scoreA, scoreB: (layer as any).scoreB } : {} }));
  return {
    question: `Which side has stronger pregame testimony: ${evidence.input.teamA} or ${evidence.input.teamB}?`,
    ring1GodView: { methods: summarize(evidence.godView.allLayers), synthesis: evidence.godView.synthesis },
    ring2AgentMoment: { event: { startTime: evidence.input.startTime, location: evidence.input.location, teamA: evidence.input.teamA, teamB: evidence.input.teamB }, chart: evidence.chart.agentView, methods: summarize(evidence.agentView.allLayers), synthesis: evidence.agentView.synthesis },
    ring3CrossFrame: { synthesis: evidence.synthesisView, parity: evidence.frameParity, additionalMethods: evidence.additionalMethods, experimentalLayers: evidence.experimentalLayers },
    natalFoundation: { present: false, note: "No personal natal foundation belongs to a sports contest; never invent one." },
    fullTechnicalEvidence: evidence,
  };
}

export const sportsReasoningSchema = z.object({
  selectedSide: z.enum(["A", "B", "NO_PICK"]),
  reasoning: z.string().min(80),
  decisiveEvidence: z.array(z.object({ frame: z.enum(["god", "agent", "cross-frame", "physical"]), method: z.string().min(1), finding: z.string().min(12) })).min(1),
  opposingEvidence: z.string().min(20),
  missingInformation: z.array(z.string()),
  confidence: z.enum(["low", "moderate"]),
  baselineAgreement: z.enum(["agree", "disagree", "baseline-unavailable"]),
});
export type SportsReasoningJudgment = z.infer<typeof sportsReasoningSchema>;
function parseJudgment(raw: string): SportsReasoningJudgment {
  let json: unknown;
  try { json = JSON.parse(raw.replace(/^\\s*```(?:json)?\\s*/, "").replace(/\\s*```\\s*$/, "")); }
  catch { throw new Error("SPORTS_REASONING_INVALID_JSON: AI judgment was not valid JSON."); }
  return sportsReasoningSchema.parse(json);
}
export async function interpretSportsEvent(input: SimulationEventInput, conversation: Array<{ role: "user" | "assistant"; content: string }> = []) {
  const evidence = { ...sportsPregameEvidence(input), pregameConditions: await getPregameConditions(input) };
  const baseline = evidence.synthesisView;
  const threeWheels = translateSportsThreeWheels(evidence);
  const response = await invokeLLM({
    max_tokens: 4500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: MASTER_SPORTS_ASTROLOGER_SYSTEM + `
Return ONLY a JSON object with:
selectedSide: "A" | "B" | "NO_PICK" (your OWN judgment, not dictated by numeric totals);
reasoning: detailed independent synthesis with specific chart evidence, team names, method interactions and contradictions;
decisiveEvidence: array of {frame: "god" | "agent" | "cross-frame" | "physical", method: exact supplied method name or "chart"/"pregameConditions", finding: evidence-grounded explanation};
opposingEvidence: strongest contrary testimony;
missingInformation: array of uncalculated/unverified facts;
confidence: "low" | "moderate" (NOT a statistical probability);
baselineAgreement: "agree" | "disagree" | "baseline-unavailable".
The baseline is ${baseline.valid ? baseline.winner : "unavailable"}. Set baselineAgreement by comparing your choice to this baseline; NO_PICK corresponds to baseline TIE. Every claim must be traceable to the supplied evidence. No outcome hindsight, fabricated facts, or betting instructions.` },
      { role: "user", content: "Judge this game independently from the complete pregame calculation record:\n" + JSON.stringify(threeWheels) },
      ...conversation,
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  const raw = typeof content === "string" ? content.trim() : Array.isArray(content) ? content.filter((part: any) => part.type === "text").map((part: any) => part.text).join("\n").trim() : "";
  if (!raw) throw new Error("SPORTS_AI_EMPTY_RESPONSE: Provider returned no sports judgment.");
  const judgment = parseJudgment(raw);
  if (!baseline.valid && judgment.selectedSide !== "NO_PICK")
    throw new Error("SPORTS_REASONING_INVALID_CHART_REQUIRES_NO_PICK");
  const expectedAgreement = !baseline.valid ? "baseline-unavailable" :
    (judgment.selectedSide === "NO_PICK" ? baseline.winner === "TIE" : judgment.selectedSide === baseline.winner) ? "agree" : "disagree";
  if (judgment.baselineAgreement !== expectedAgreement)
    throw new Error("SPORTS_REASONING_BASELINE_COMPARISON_INVALID");
  const knownMethods = new Set([
    "chart", "pregameConditions",
    ...evidence.godView.allLayers.map(m => m.name),
    ...evidence.agentView.allLayers.map(m => m.name),
    ...evidence.additionalMethods.godView.map(m => m.name),
    ...evidence.additionalMethods.agentView.map(m => m.name),
  ]);
  for (const finding of judgment.decisiveEvidence) {
    if (!knownMethods.has(finding.method))
      throw new Error("SPORTS_REASONING_UNKNOWN_METHOD: " + finding.method);
  }
  const team = judgment.selectedSide === "A" ? evidence.input.teamA : judgment.selectedSide === "B" ? evidence.input.teamB : null;
  return {
    evidence, threeWheels, modelProvenance: { provider: "google-gemini" as const, model: response.model }, judgment,
    prediction: { selectedSide: judgment.selectedSide, team, source: "independent_ai_reasoning" as const },
    baseline: { winner: baseline.winner, scoreA: baseline.scoreA, scoreB: baseline.scoreB, valid: baseline.valid },
    interpretation: judgment.reasoning,
  };
}
