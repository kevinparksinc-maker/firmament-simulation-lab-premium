import { describe, expect, it } from "vitest";
import {
  fallbackReasoning,
  intelligentReasoningResultSchema,
  validateIntelligentReasoningResult,
  type IntelligentReasoningInput,
} from "./intelligentReasoning";

const input: IntelligentReasoningInput = {
  event: { id: "event-1", teamA: "A", teamB: "B", sport: "NBA", startTime: "2026-01-01T00:00:00.000Z", roleAssignmentSource: "manual" },
  masterChart: { id: "MASTER-1", calculationVersion: "v1", sharedAcrossMethods: true },
  integrity: {
    sharedMasterChart: true,
    masterChartId: "MASTER-1",
    sideAssignmentExplicit: true,
    teamIdentityPresent: false,
    sportPresent: true,
    evidenceReferencesValid: true,
    astronomyRecalculatedByAI: false,
    unsupportedFactsIntroduced: false,
  },
  evidence: {
    baseline: { prediction: "A", scoreA: 12, scoreB: 8 },
    synthesis: { prediction: "A", scoreA: 10, scoreB: 7, valid: true },
    frameParity: { valid: true, state: "AGREE", winner: "A" },
    methods: [{ id: "god:M1", name: "M1", frame: "god", prediction: "A", scoreA: 2, scoreB: 1, evaluable: true }],
    references: [
      { id: "BASELINE", source: "baseline", prediction: "A", note: "baseline" },
      { id: "SYNTHESIS", source: "synthesis", prediction: "A", note: "synthesis" },
      { id: "FRAME-PARITY", source: "frame", prediction: "A", note: "parity" },
    ],
  },
};

const validResult = {
  prediction: "A",
  confidence: 0.7,
  confidenceLabel: "high",
  evidenceUsed: [{ id: "SYNTHESIS", source: "synthesis", prediction: "A", note: "The synthesis supports Side A." }],
  contradictions: [],
  missingInputs: ["Team-specific performance features are absent."],
  integrityChecks: input.integrity,
  reasoningSummary: "Side A is supported by the supplied synthesis.",
  modelVersion: "test-model",
  status: "accepted",
} as const;

describe("IntelligentReasoningResult", () => {
  it("accepts a structured result with only supplied evidence IDs", () => {
    const parsed = validateIntelligentReasoningResult(validResult, input);
    expect(parsed.prediction).toBe("A");
    expect(parsed.integrityChecks.evidenceReferencesValid).toBe(true);
  });

  it("rejects unsupported evidence references", () => {
    expect(() => validateIntelligentReasoningResult({ ...validResult, evidenceUsed: [{ ...validResult.evidenceUsed[0], id: "INVENTED" }] }, input)).toThrow("INTELLIGENT_REASONING_INVALID_EVIDENCE_REFERENCE");
  });

  it("rejects unsafe claims that AI recalculated astronomy", () => {
    expect(() => intelligentReasoningResultSchema.parse({ ...validResult, integrityChecks: { ...input.integrity, astronomyRecalculatedByAI: true } })).toThrow();
  });

  it("returns a transparent deterministic fallback and preserves conflicts", () => {
    const conflicted = { ...input, evidence: { ...input.evidence, synthesis: { ...input.evidence.synthesis, prediction: "B" as const }, frameParity: { valid: false, state: "DISAGREE", winner: "B" as const } } };
    const result = fallbackReasoning(conflicted, "INTELLIGENT_REASONING_UNAVAILABLE");
    expect(result.status).toBe("fallback");
    expect(result.modelVersion).toBe("deterministic-fallback");
    expect(result.contradictions.map(item => item.type)).toEqual(expect.arrayContaining(["baseline-synthesis-disagreement", "frame-disagreement"]));
    expect(result.integrityChecks.teamIdentityPresent).toBe(false);
  });
});
