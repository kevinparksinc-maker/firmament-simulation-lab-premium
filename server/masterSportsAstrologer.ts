import { getPregameConditions } from "./pregameConditions";
import type { SimulationEventInput } from "./engine/simulationAdapter";
import { runSimulationEvent } from "./engine/simulationAdapter";
import { invokeLLM } from "./_core/llm";
import { buildSportsAdjudication, validateAnalystJudgment, type AnalystJudgment } from "./engine/sportsAdjudication";

export const MASTER_SPORTS_ASTROLOGER_SYSTEM = `
You judge a sports matchup from an evidence package that has already been evaluated. Treat the package as the complete source for astrological claims. Compare the evidence without calculating placements, changing scores, or applying rules from memory. Keep reported physical conditions separate. Prior conversation may clarify the question; it cannot supply chart facts or outcomes.

Build both teams' cases using their strongest applicable items. BOTH is mixed testimony and cannot be counted twice as independent support. Address every contradiction exactly once. Apply its supplied rule only when the ledger names it. Otherwise explain the judgment call and give a null rule ID. Compare the decisive relationship to the strongest opposition. Close or insufficient cases can be NO_PICK with a null decisive factor. Confidence is a symbolic judgment indicator, never a probability.

Return JSON only with these exact fields:
predictedWinner: "ASC" | "DSC" | "NO_PICK";
confidence: number from 0 to 1;
ascCase, dscCase: arrays of up to 3 {evidenceId, claim}, include at least 2 when available;
contradictionsAddressed: array of {contradictionId, resolution: "rule" | "judgment", citedRuleId: string | null, reasoning};
decisiveFactor: {evidenceId, why} | null;
opposingEvidence: {evidenceId, whyItDoesNotOutweigh} | null;
confidenceBasis: string.
Each evidence ID is an exact supplied EV ID. Put IDs in the structured fields only. Keep each explanation within 340 characters. Discuss only facts supported by the cited item. If the chart is unusable, return NO_PICK. Do not use postgame outcomes or give wager instructions.
`.trim();

export function sportsPregameEvidence(input: SimulationEventInput) {
  return serializePregameEvidence(runSimulationEvent({ ...input, actualWinner: undefined }));
}

function serializePregameEvidence(simulation: ReturnType<typeof runSimulationEvent>) {
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

function presentJudgment(judgment: AnalystJudgment, teamASC: string, teamDSC: string) {
  const label = judgment.predictedWinner === "ASC" ? teamASC : judgment.predictedWinner === "DSC" ? teamDSC : "No pick";
  const cases = [[teamASC, judgment.ascCase], [teamDSC, judgment.dscCase]] as const;
  return [
    `**${label}**`,
    ...cases.filter(([, claims]) => claims.length).map(([team, claims]) =>
      `**${team}** — ${claims.map(row => `${row.claim} [${row.evidenceId}]`).join(" ")}`),
    ...(judgment.contradictionsAddressed.length ? [`**Contradictions** — ${judgment.contradictionsAddressed.map(row =>
      `${row.reasoning} [${row.contradictionId}]${row.citedRuleId ? ` [${row.citedRuleId}]` : ""}`).join(" ")}`] : []),
    ...(judgment.decisiveFactor ? [`**Decisive factor** — ${judgment.decisiveFactor.why} [${judgment.decisiveFactor.evidenceId}]`] : []),
    ...(judgment.opposingEvidence ? [`**Strongest opposition** — ${judgment.opposingEvidence.whyItDoesNotOutweigh} [${judgment.opposingEvidence.evidenceId}]`] : []),
    judgment.confidenceBasis,
  ].join("\n\n");
}

export async function interpretSportsEvent(input: SimulationEventInput, conversation: Array<{ role: "user" | "assistant"; content: string }> = []) {
  const start = performance.now();
  const simulation = runSimulationEvent({ ...input, actualWinner: undefined });
  const pregameConditions = await getPregameConditions(input);
  const analyst = buildSportsAdjudication(simulation, pregameConditions);
  const evidence = { ...serializePregameEvidence(simulation), pregameConditions };
  const baseline = evidence.synthesisView;
  const threeWheels = translateSportsThreeWheels(evidence);
  const payload = JSON.stringify({
    ...analyst,
    question: [...conversation].reverse().find(message => message.role === "user")?.content.slice(0, 1200),
  });
  let judgment: AnalystJudgment | null = null;
  let metrics: ReturnType<typeof validateAnalystJudgment>["metrics"] | null = null;
  let modelProvenance: { provider: "google-gemini"; model: string } | null = null;
  let usage: Awaited<ReturnType<typeof invokeLLM>>["usage"];
  let failure: "provider" | "invalid-judgment" | "unusable-chart" | null = null;
  let failureCode: string | undefined;
  let requestCount = 0;

  if (analyst.chartUsable) {
    try {
      requestCount += 1;
      const response = await invokeLLM({
        max_tokens: 2600,
        singleAttempt: true,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: MASTER_SPORTS_ASTROLOGER_SYSTEM }, { role: "user", content: payload }],
      });
      modelProvenance = { provider: "google-gemini", model: response.model };
      usage = response.usage;
      const content = response.choices?.[0]?.message?.content;
      const raw = typeof content === "string" ? content : content?.flatMap(part => part.type === "text" ? [part.text] : []).join("\n") ?? "";
      const validated = validateAnalystJudgment(analyst, JSON.parse(raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/, "").replace(/\s*\x60\x60\x60$/, "")));
      judgment = validated.result;
      metrics = validated.metrics;
    } catch (error) {
      failure = modelProvenance ? "invalid-judgment" : "provider";
      const code = error instanceof Error ? error.message.match(/^SPORTS_[A-Z_]+/)?.[0] : undefined;
      failureCode = code ?? (failure === "provider" ? "SPORTS_ANALYST_PROVIDER_ERROR" : "SPORTS_ANALYST_INVALID_RESPONSE");
    }
  } else {
    failure = "unusable-chart";
    failureCode = "SPORTS_ANALYST_UNUSABLE_CHART";
  }

  const decided = judgment?.predictedWinner ?? (analyst.chartUsable ? analyst.ranking.lean : "NO_PICK");
  const selectedSide = decided === "ASC" ? "A" : decided === "DSC" ? "B" : "NO_PICK";
  const team = selectedSide === "A" ? evidence.input.teamA : selectedSide === "B" ? evidence.input.teamB : null;
  const interpretation = judgment
    ? presentJudgment(judgment, evidence.input.teamA, evidence.input.teamB)
    : `**${team ?? "No pick"}**\n\n${failure === "unusable-chart" ? "Chart parity did not pass." : "AI adjudication was unavailable. This is the local evidence evaluator’s result."}`;
  return {
    evidence, threeWheels, analyst, modelProvenance, judgment,
    analystAudit: { status: failure ?? "accepted", failureCode, metrics, usage, requestCount,
      evidenceBytes: Buffer.byteLength(payload), latencyMs: Math.round(performance.now() - start) },
    prediction: { selectedSide, team, source: judgment ? "independent_ai_reasoning" as const : "deterministic_evaluator" as const },
    baseline: { winner: baseline.winner, scoreA: baseline.scoreA, scoreB: baseline.scoreB, valid: baseline.valid },
    interpretation,
  };
}
