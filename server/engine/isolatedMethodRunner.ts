import {
  generateFixedJ2000KPPrediction,
  generatePredictionForModel,
  ASCENDANT_HORIZON_VERSION,
  type GameInput,
} from "./firmamentEngine";
import { runIsolatedCoreLayer, resolveAgentFrameGeometry } from "./fullPackageDualFrameChallenger";
import { METHOD_NAMES } from "./frameworkContract";
import { METHOD_REGISTRY, buildMethodChartSnapshot, runMethod } from "./methodRegistry";
import { completeChartLedger } from "./completeChartLedger";
import type { SimulationEventInput } from "./simulationAdapter";
import { resolveEventContract } from "./eventPipelineContract";
import { getMethodCertificationGate } from "./methodCertificationPolicy";

/** A method field runs ONE named method across the two physical frames.
 * Zero from a real arithmetic operation is recorded as data, never disguised
 * as a "neutral prediction". No trigger / missing input / incomplete method
 * are explicitly distinguished from a nonzero equal-strength tie.
 */
export const INDEPENDENT_METHOD_FIELDS = Object.freeze([
  ...METHOD_NAMES.map((name, i) => ({ id: `CORE_${String(i + 1).padStart(2, "0")}`, name, family: "Core", index: i, kind: "core" as const })),
  ...METHOD_REGISTRY.map((spec, i) => ({ id: spec.id, name: spec.name, family: spec.family, index: i, kind: "registry" as const })),
]);

export type SingleMethodFrame = {
  frame: "God View" | "Agent View";
  scoreA: number | null;
  scoreB: number | null;
  result: "A" | "B" | "EQUAL_SCORES" | "NO_QUALIFYING_CONDITION" | "ZERO_NET_UNRESOLVED" | "MISSING_INPUT" | "EVIDENCE_ONLY";
  difference: number | null;
  formula: string;
  inputs: string[];
  steps: string[];
  evidence: string[];
  completeness: string;
  chart: ReturnType<typeof completeChartLedger>;
};

export type SingleMethodEventResult = {
  version: "SINGLE_METHOD_RESEARCH_V1";
  agentAscendantModelVersion: typeof ASCENDANT_HORIZON_VERSION | "DAWN_ANCHORED_APPROX_V1";
  methodId: string;
  methodName: string;
  methodFamily: string;
  frameMethodStatus: "READY_FOR_EXPERIMENT" | "NOT_EVALUABLE" | "POLICY_CONFLICT" | "INCOMPLETE_DOCTRINE";
  certification: "NOT_CERTIFIED";
  methodologyNotes: string[];
  event: { teamA: string; teamB: string; startTime: string; sport: string; oddsSource: string | null; roleAssignmentSource: string };
  god: SingleMethodFrame;
  agent: SingleMethodFrame;
  combined: { scoreA: number | null; scoreB: number | null; difference: number | null; result: SingleMethodFrame["result"]; calculation: string };
  actualWinner: "A" | "B" | "TIE" | null;
  comparison: "HIT" | "MISS" | "EQUAL_SCORES" | "NO_TRIGGER" | "ZERO_NET_UNRESOLVED" | "NOT_EVALUABLE" | "UNVERIFIED";
};

const round = (x: number) => Number(x.toFixed(5));
export const classifyRawMethodScores = (
  a: number | null,
  b: number | null,
  kind: "ordinary" | "shared" = "ordinary",
  knownQualifyingContributions: number | null = null,
): SingleMethodFrame["result"] => {
  if (a === null || b === null) return "MISSING_INPUT";
  if (kind === "shared") return "EVIDENCE_ONLY";
  if (a === 0 && b === 0) {
    if (knownQualifyingContributions === 0) return "NO_QUALIFYING_CONDITION";
    if (knownQualifyingContributions !== null) return "EQUAL_SCORES"; // algebraic cancellation of actual signed points
    return "ZERO_NET_UNRESOLVED"; // no proof whether contacts were absent or canceled
  }
  if (Math.abs(a - b) < 1e-9) return "EQUAL_SCORES";
  return a > b ? "A" : "B";
};


export function runSingleMethodEvent(input: SimulationEventInput, methodId: string): SingleMethodEventResult {
  const spec = INDEPENDENT_METHOD_FIELDS.find(m => m.id === methodId);
  if (!spec) throw new RangeError(`Unknown individual method ${methodId}`);
  const { gameInput: game, startTime: date, favoredTeam: teamA,
    underdogTeam: teamB, roleAssignmentSource, provenanceWarning } = resolveEventContract(input);
  if (input.agentViewRotation === "whole-chart") {
    throw new RangeError("Standalone mode cannot silently rotate planetary longitudes. Opposition shadow calculations require separate certification.");
  }
  let god: SingleMethodFrame, agent: SingleMethodFrame;

  if (spec.kind === "core") {
    const makeFrame = (frame: "god" | "agent"): SingleMethodFrame => {
      const isolated = runIsolatedCoreLayer(game, spec.index, frame, {
        agentViewRotation: input.agentViewRotation === "ascendant-only" ? "ascendant-only" : "none",
        agentViewModel: input.agentViewModel ?? "astronomical",
      });
      const l = isolated.layer;
      const scoreA = Number.isFinite(l.scoreA) ? l.scoreA : null;
      const scoreB = Number.isFinite(l.scoreB) ? l.scoreB : null;
      return {
        frame: frame === "god" ? "God View" : "Agent View",
        scoreA, scoreB,
        result: classifyRawMethodScores(scoreA, scoreB, l.ruleClass === "SHARED" ? "shared" : "ordinary",
          isolated.qualifyingScoreContributions ??
            ((l.detail.startsWith("No ") || l.detail.startsWith("No scoring ")) ? 0 : null)),
        difference: scoreA !== null && scoreB !== null ? round(scoreA - scoreB) : null,
        formula: l.calculation?.formula ?? "MISSING FORMULA — audit required",
        inputs: l.calculation?.inputs ?? [],
        steps: l.calculation?.steps ?? [],
        evidence: [l.detail, ...("limitation" in l && l.limitation ? [l.limitation] : [])],
        completeness: isolated.calculationScope,
        chart: isolated.chart,
      };
    };
    god = makeFrame("god"); agent = makeFrame("agent");
  } else {
    const godPrediction = generateFixedJ2000KPPrediction(game);
    const agentPrediction = generatePredictionForModel(game, "azimuth");
    const agentGeometry = resolveAgentFrameGeometry(game, {
      agentViewRotation: input.agentViewRotation === "ascendant-only" ? "ascendant-only" : "none",
      agentViewModel: input.agentViewModel ?? "astronomical",
    });
    const makeFrame = (frame: "god" | "agent"): SingleMethodFrame => {
      const prediction = frame === "god" ? godPrediction : agentPrediction;
      const snapshot = buildMethodChartSnapshot(
        prediction, date, frame, frame === "god" ? 0 : agentGeometry.ascendantLongitude);
      if (frame === "agent") {
        // A mismatched chart invalidates this isolated calculation; never
        // silently report one geometry for core and another for Vedic layers.
        const expected = new Map(agentGeometry.planetPositions.map(p => [p.planet, p]));
        for (const p of snapshot.prediction.planets) {
          const corresponding = expected.get(p.planet);
          if (!corresponding || corresponding.house !== p.house ||
              Math.abs(corresponding.longitude - p.backgroundWheelLongitude) > 1e-7) {
            throw new Error(`Shared Agent View geometry mismatch for ${p.planet}.`);
          }
        }
      }
      // The actual singled-out registry entry is the ONLY registry method called.
      const method = runMethod(methodId, { prediction: snapshot.prediction, eventTime: date });
      const scoreA = method.scoreA, scoreB = method.scoreB;
      const chart = completeChartLedger(snapshot.prediction.planets.map(p => ({
        planet: p.planet, longitude: p.backgroundWheelLongitude, house: p.house,
        sign: p.sign, degreeInSign: p.backgroundWheelLongitude % 30,
        nakshatra: p.nakshatra, manzil: p.manzil,
      })));
      return {
        frame: frame === "god" ? "God View" : "Agent View", scoreA, scoreB,
        result: method.evaluable ? classifyRawMethodScores(scoreA, scoreB) : "MISSING_INPUT",
        difference: scoreA !== null && scoreB !== null ? round(scoreA - scoreB) : null,
        formula: JSON.stringify(METHOD_REGISTRY.find(m => m.id === methodId)!.configuration),
        inputs: method.evidence.map(e => e.explanation), steps: [],
        evidence: [method.detail, ...method.evidence.map(e => e.explanation)],
        completeness: "Registered method executed independently. Explicit calculation-steps trace is not yet implemented and is NOT certified.",
        chart,
      };
    };
    god = makeFrame("god"); agent = makeFrame("agent");
  }
  const independentStatus = getMethodCertificationGate(methodId);
  const incomplete = god.result === "MISSING_INPUT" || agent.result === "MISSING_INPUT";
  const status = incomplete ? "NOT_EVALUABLE" as const : independentStatus.status;
  const hasNumericFrames = !incomplete &&
    god.scoreA !== null && god.scoreB !== null &&
    agent.scoreA !== null && agent.scoreB !== null &&
    [god.scoreA, god.scoreB, agent.scoreA, agent.scoreB].every(Number.isFinite);
  const ready = hasNumericFrames && status === "READY_FOR_EXPERIMENT" &&
    god.result !== "EVIDENCE_ONLY" && agent.result !== "EVIDENCE_ONLY";
  // Preserve synthesis ARITHMETIC even when a method is doctrinally
  // quarantined. Only its PREDICTIVE result is withheld; the actual two
  // scored frame values must never be erased from a certification review.
  const a = hasNumericFrames ? round((god.scoreA! + agent.scoreA!) / 2) : null;
  const b = hasNumericFrames ? round((god.scoreB! + agent.scoreB!) / 2) : null;
  const bothNoTrigger = god.result === "NO_QUALIFYING_CONDITION" && agent.result === "NO_QUALIFYING_CONDITION";
  const eitherUnknownZero = god.result === "ZERO_NET_UNRESOLVED" || agent.result === "ZERO_NET_UNRESOLVED";
  const combinedResult: SingleMethodFrame["result"] = !ready ? (incomplete ? "MISSING_INPUT" : "EVIDENCE_ONLY")
    : a === 0 && b === 0 ? (bothNoTrigger ? "NO_QUALIFYING_CONDITION" : eitherUnknownZero ? "ZERO_NET_UNRESOLVED" : "EQUAL_SCORES")
    : classifyRawMethodScores(a, b);
  const actualWinner = input.actualWinner ?? null;
  const comparison: SingleMethodEventResult["comparison"] =
    !actualWinner ? "UNVERIFIED" :
    combinedResult === "NO_QUALIFYING_CONDITION" ? "NO_TRIGGER" :
    combinedResult === "ZERO_NET_UNRESOLVED" ? "ZERO_NET_UNRESOLVED" :
    combinedResult === "EQUAL_SCORES" ? "EQUAL_SCORES" :
    (combinedResult !== "A" && combinedResult !== "B") ? "NOT_EVALUABLE" :
    combinedResult === actualWinner ? "HIT" : "MISS";
  return {
    version: "SINGLE_METHOD_RESEARCH_V1",
    agentAscendantModelVersion: input.agentViewModel === "fixed-earth-dawn-anchored" ? "DAWN_ANCHORED_APPROX_V1" : ASCENDANT_HORIZON_VERSION,
    methodId, methodName: spec.name, methodFamily: spec.family,
    frameMethodStatus: status,
    certification: "NOT_CERTIFIED",
    methodologyNotes: provenanceWarning ? [...independentStatus.reasons, provenanceWarning] : independentStatus.reasons,
    event: { teamA, teamB, startTime: date.toISOString(), sport: input.sport,
      oddsSource: input.oddsSource ?? null, roleAssignmentSource },
    god, agent,
    combined: {
      scoreA: a, scoreB: b, difference: a !== null && b !== null ? round(a - b) : null,
      result: combinedResult,
      calculation: "Per-method arithmetic: average corresponding God/Agent A and B scores WITHOUT any other method. The arithmetic is visible even if the method is quarantined; its predictive verdict is withheld until eligible.",
    },
    actualWinner, comparison,
  };
}
