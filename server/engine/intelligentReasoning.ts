import { z } from "zod";
import { getConfiguredLLMModel, invokeLLM } from "../_core/llm";
import type { runSimulationEvent } from "./simulationAdapter";

type Simulation = ReturnType<typeof runSimulationEvent>;
type Prediction = "A" | "B" | "TIE";

export type IntelligentEvidenceReference = {
  id: string;
  source: "baseline" | "synthesis" | "method" | "frame" | "integrity";
  prediction?: Prediction;
  note: string;
};

export type IntelligentContradiction = {
  id: string;
  type: "frame-disagreement" | "method-disagreement" | "baseline-synthesis-disagreement" | "missing-input" | "other";
  description: string;
  resolution: "unresolved" | "acknowledged" | "resolved-by-evidence";
  evidenceIds: string[];
};

export type IntelligentIntegrityChecks = {
  sharedMasterChart: boolean;
  masterChartId: string | null;
  sideAssignmentExplicit: boolean;
  teamIdentityPresent: boolean;
  sportPresent: boolean;
  evidenceReferencesValid: boolean;
  astronomyRecalculatedByAI: false;
  unsupportedFactsIntroduced: false;
};

export interface IntelligentReasoningResult {
  prediction: Prediction;
  confidence: number;
  confidenceLabel: "low" | "moderate" | "high";
  evidenceUsed: IntelligentEvidenceReference[];
  contradictions: IntelligentContradiction[];
  missingInputs: string[];
  integrityChecks: IntelligentIntegrityChecks;
  reasoningSummary: string;
  modelVersion: string;
  status: "accepted" | "fallback";
  failureCode?: string;
}

export type IntelligentReasoningInput = {
  event: {
    id: string;
    teamA: string;
    teamB: string;
    sport: string;
    startTime: string;
    roleAssignmentSource: string;
  };
  masterChart: {
    id: string | null;
    calculationVersion: string | null;
    sharedAcrossMethods: boolean;
  };
  integrity: IntelligentIntegrityChecks;
  evidence: {
    baseline: { prediction: Prediction; scoreA: number; scoreB: number };
    synthesis: { prediction: Prediction; scoreA: number; scoreB: number; valid: boolean };
    frameParity: { valid: boolean; state: string; winner: Prediction | null };
    methods: Array<{
      id: string;
      name: string;
      frame: "god" | "agent";
      prediction: Prediction | "NONE";
      scoreA: number | null;
      scoreB: number | null;
      evaluable: boolean;
    }>;
    references: IntelligentEvidenceReference[];
  };
};

const evidenceReferenceSchema = z.object({
  id: z.string().min(1).max(80),
  source: z.enum(["baseline", "synthesis", "method", "frame", "integrity"]),
  prediction: z.enum(["A", "B", "TIE"]).optional(),
  note: z.string().trim().min(1).max(360),
}).strict();

const contradictionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(["frame-disagreement", "method-disagreement", "baseline-synthesis-disagreement", "missing-input", "other"]),
  description: z.string().trim().min(1).max(360),
  resolution: z.enum(["unresolved", "acknowledged", "resolved-by-evidence"]),
  evidenceIds: z.array(z.string().min(1).max(80)).max(12),
}).strict();

export const intelligentReasoningResultSchema = z.object({
  prediction: z.enum(["A", "B", "TIE"]),
  confidence: z.number().min(0).max(1),
  confidenceLabel: z.enum(["low", "moderate", "high"]),
  evidenceUsed: z.array(evidenceReferenceSchema).max(12),
  contradictions: z.array(contradictionSchema).max(12),
  missingInputs: z.array(z.string().trim().min(1).max(240)).max(12),
  integrityChecks: z.object({
    sharedMasterChart: z.boolean(),
    masterChartId: z.string().nullable(),
    sideAssignmentExplicit: z.boolean(),
    teamIdentityPresent: z.boolean(),
    sportPresent: z.boolean(),
    evidenceReferencesValid: z.boolean(),
    astronomyRecalculatedByAI: z.literal(false),
    unsupportedFactsIntroduced: z.literal(false),
  }).strict(),
  reasoningSummary: z.string().trim().min(1).max(1200),
  modelVersion: z.string().trim().min(1).max(160),
  status: z.enum(["accepted", "fallback"]),
  failureCode: z.string().trim().max(120).optional(),
}).strict();

export const intelligentReasoningJsonSchema = {
  name: "intelligent_reasoning_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      prediction: { type: "string", enum: ["A", "B", "TIE"] },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      confidenceLabel: { type: "string", enum: ["low", "moderate", "high"] },
      evidenceUsed: { type: "array", maxItems: 12, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, source: { type: "string", enum: ["baseline", "synthesis", "method", "frame", "integrity"] }, prediction: { type: ["string", "null"], enum: ["A", "B", "TIE", null] }, note: { type: "string" } }, required: ["id", "source", "note"] } },
      contradictions: { type: "array", maxItems: 12, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, type: { type: "string", enum: ["frame-disagreement", "method-disagreement", "baseline-synthesis-disagreement", "missing-input", "other"] }, description: { type: "string" }, resolution: { type: "string", enum: ["unresolved", "acknowledged", "resolved-by-evidence"] }, evidenceIds: { type: "array", items: { type: "string" } } }, required: ["id", "type", "description", "resolution", "evidenceIds"] } },
      missingInputs: { type: "array", maxItems: 12, items: { type: "string" } },
      integrityChecks: { type: "object", additionalProperties: false, properties: { sharedMasterChart: { type: "boolean" }, masterChartId: { type: ["string", "null"] }, sideAssignmentExplicit: { type: "boolean" }, teamIdentityPresent: { type: "boolean" }, sportPresent: { type: "boolean" }, evidenceReferencesValid: { type: "boolean" }, astronomyRecalculatedByAI: { type: "boolean", enum: [false] }, unsupportedFactsIntroduced: { type: "boolean", enum: [false] } }, required: ["sharedMasterChart", "masterChartId", "sideAssignmentExplicit", "teamIdentityPresent", "sportPresent", "evidenceReferencesValid", "astronomyRecalculatedByAI", "unsupportedFactsIntroduced"] },
      reasoningSummary: { type: "string" },
      modelVersion: { type: "string" },
      status: { type: "string", enum: ["accepted", "fallback"] },
      failureCode: { type: "string" },
    },
    required: ["prediction", "confidence", "confidenceLabel", "evidenceUsed", "contradictions", "missingInputs", "integrityChecks", "reasoningSummary", "modelVersion", "status"],
  },
} as const;

const predictionFromScores = (scoreA: number, scoreB: number): Prediction => scoreA === scoreB ? "TIE" : scoreA > scoreB ? "A" : "B";

function textContent(response: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : content?.filter(part => part.type === "text").map(part => part.text).join("\n") ?? "";
}

function buildReasoningInput(simulation: Simulation): IntelligentReasoningInput {
  const roleAssignmentSource = simulation.input.roleAssignmentSource ?? "legacy-side-order";
  const masterChartId = simulation.methodResults.masterChartId ?? null;
  const references: IntelligentEvidenceReference[] = [
    { id: "BASELINE", source: "baseline", prediction: simulation.baseline.winner, note: "Shared master-chart baseline prediction and scores." },
    { id: "SYNTHESIS", source: "synthesis", prediction: simulation.synthesisView.winner, note: "Cross-frame synthesis prediction and scores." },
    { id: "FRAME-PARITY", source: "frame", prediction: simulation.comparison.winner ?? undefined, note: `Frame parity state: ${simulation.comparison.state}; valid=${simulation.frameParity.valid}.` },
  ];
  const methods = [
    ...simulation.methodResults.godView.map(method => ({ ...method, frame: "god" as const })),
    ...simulation.methodResults.agentView.map(method => ({ ...method, frame: "agent" as const })),
  ].map(method => ({
    id: `${method.frame}:${method.methodId}`,
    name: method.methodId,
    frame: method.frame,
    prediction: method.prediction,
    scoreA: method.scoreA,
    scoreB: method.scoreB,
    evaluable: method.evaluable,
  }));
  return {
    event: { id: simulation.id, teamA: simulation.input.teamA, teamB: simulation.input.teamB, sport: simulation.input.sport, startTime: simulation.input.startTime, roleAssignmentSource },
    masterChart: { id: masterChartId, calculationVersion: simulation.methodResults.calculationVersion ?? null, sharedAcrossMethods: Boolean(masterChartId) },
    integrity: {
      sharedMasterChart: Boolean(masterChartId),
      masterChartId,
      sideAssignmentExplicit: roleAssignmentSource !== "legacy-side-order",
      // Names are present, but the current engine does not use team-specific features in its core scores.
      teamIdentityPresent: false,
      sportPresent: Boolean(simulation.input.sport),
      evidenceReferencesValid: true,
      astronomyRecalculatedByAI: false,
      unsupportedFactsIntroduced: false,
    },
    evidence: {
      baseline: { prediction: simulation.baseline.winner, scoreA: simulation.baseline.combined.scoreA, scoreB: simulation.baseline.combined.scoreB },
      synthesis: { prediction: simulation.synthesisView.winner, scoreA: simulation.synthesisView.scoreA, scoreB: simulation.synthesisView.scoreB, valid: simulation.synthesisView.valid },
      frameParity: { valid: simulation.frameParity.valid, state: simulation.comparison.state, winner: simulation.comparison.winner ?? null },
      methods,
      references,
    },
  };
}

function fallbackReasoning(input: IntelligentReasoningInput, failureCode: string): IntelligentReasoningResult {
  const baseline = input.evidence.baseline;
  const synthesis = input.evidence.synthesis;
  const prediction = synthesis.valid ? synthesis.prediction : baseline.prediction;
  const same = baseline.prediction === synthesis.prediction;
  const confidence = prediction === "TIE" ? 0.35 : same && input.evidence.frameParity.valid ? 0.65 : 0.45;
  const contradictions: IntelligentContradiction[] = [];
  if (!same) contradictions.push({ id: "CX-BASELINE-SYNTHESIS", type: "baseline-synthesis-disagreement", description: "The deterministic baseline and cross-frame synthesis select different sides.", resolution: "unresolved", evidenceIds: ["BASELINE", "SYNTHESIS"] });
  if (!input.evidence.frameParity.valid) contradictions.push({ id: "CX-FRAME-PARITY", type: "frame-disagreement", description: "God and Agent frame parity did not pass; the disagreement is retained rather than converted into a vote.", resolution: "unresolved", evidenceIds: ["FRAME-PARITY"] });
  const missingInputs = [
    ...(!input.integrity.sideAssignmentExplicit ? ["Explicit side-role assignment was not supplied; legacy side order is in use."] : []),
    "Team-specific performance features are not part of the deterministic evidence package.",
  ];
  return {
    prediction,
    confidence,
    confidenceLabel: confidence >= 0.7 ? "high" : confidence >= 0.5 ? "moderate" : "low",
    evidenceUsed: input.evidence.references,
    contradictions,
    missingInputs,
    integrityChecks: { ...input.integrity, evidenceReferencesValid: true },
    reasoningSummary: `AI reasoning was unavailable. Deterministic evidence indicates ${prediction === "A" ? "Side A" : prediction === "B" ? "Side B" : "a tie/no-call"}; this is a fallback and not an independent AI judgment.`,
    modelVersion: "deterministic-fallback",
    status: "fallback",
    failureCode,
  };
}

export function validateIntelligentReasoningResult(value: unknown, input: IntelligentReasoningInput): IntelligentReasoningResult {
  const parsed = intelligentReasoningResultSchema.parse(value);
  const knownIds = new Set(input.evidence.references.map(reference => reference.id));
  for (const item of input.evidence.methods) knownIds.add(item.id);
  const referencedIds = [...parsed.evidenceUsed.map(item => item.id), ...parsed.contradictions.flatMap(item => item.evidenceIds)];
  if (referencedIds.some(id => !knownIds.has(id))) throw new Error("INTELLIGENT_REASONING_INVALID_EVIDENCE_REFERENCE");
  if (parsed.integrityChecks.astronomyRecalculatedByAI || parsed.integrityChecks.unsupportedFactsIntroduced) throw new Error("INTELLIGENT_REASONING_UNSAFE_CLAIMS");
  return { ...parsed, integrityChecks: { ...parsed.integrityChecks, evidenceReferencesValid: true } };
}

export async function reasonAboutSimulation(simulation: Simulation): Promise<IntelligentReasoningResult> {
  const input = buildReasoningInput(simulation);
  try {
    const response = await invokeLLM({
      model: getConfiguredLLMModel(),
      max_tokens: 2600,
      singleAttempt: true,
      response_format: { type: "json_schema", json_schema: intelligentReasoningJsonSchema },
      messages: [
        { role: "system", content: "You are the Premium Simulation Lab's evidence-grounded reasoning layer. Interpret only the supplied deterministic master-chart and method evidence. Never calculate astronomy, change scores, majority-vote blindly, or invent team statistics, injuries, odds, placements, or facts. Team names and sport are metadata unless a supplied evidence item makes them predictive features. Preserve disagreements as contradictions. Every evidence ID must exactly match a supplied ID. Return JSON only." },
        { role: "user", content: JSON.stringify(input) },
      ],
    });
    const raw = textContent(response).trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    const parsed = validateIntelligentReasoningResult(JSON.parse(raw), input);
    return { ...parsed, modelVersion: response.model, status: "accepted" };
  } catch (error) {
    const failureCode = error instanceof Error && error.message.startsWith("SPORTS_") ? error.message.split(":")[0] : "INTELLIGENT_REASONING_UNAVAILABLE";
    return fallbackReasoning(input, failureCode);
  }
}

export { buildReasoningInput, fallbackReasoning, predictionFromScores };
