import {
  generateFixedJ2000KPPrediction,
  generatePredictionForModel,
  type GameInput,
} from "./firmamentEngine";
import { runIsolatedCoreLayer } from "./fullPackageDualFrameChallenger";
import { METHOD_NAMES } from "./frameworkContract";
import { METHOD_REGISTRY, buildMethodChartSnapshot, runMethod } from "./methodRegistry";
import { completeChartLedger } from "./completeChartLedger";
import type { SimulationEventInput } from "./simulationAdapter";

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

const classify = (methodId: string) => {
  if (methodId === "HARMONICS_V1" || methodId === "CORE_05" || methodId === "CORE_09") return {
    status: "POLICY_CONFLICT" as const,
    notes: ["Legacy method uses different relationship-orb rules from the universal five-degree specification; preserve the raw scores but quarantine certification."],
  };
  if (["CORE_13", "CORE_17", "CORE_19"].includes(methodId)) return {
    status: "INCOMPLETE_DOCTRINE" as const,
    notes: ["Method is missing traditional applying/separating or VOC calculations and cannot be certified just because a proxy generated points."],
  };
  return { status: "READY_FOR_EXPERIMENT" as const, notes: ["Execution and availability do NOT mean method doctrine, full-chart coverage or empirical performance has been certified."] };
};

export function runSingleMethodEvent(input: SimulationEventInput, methodId: string): SingleMethodEventResult {
  const spec = INDEPENDENT_METHOD_FIELDS.find(m => m.id === methodId);
  if (!spec) throw new RangeError(`Unknown individual method ${methodId}`);
  const date = new Date(input.startTime);
  if (!Number.isFinite(date.getTime())) throw new RangeError("Invalid event startTime");
  if (input.agentViewRotation === "whole-chart") {
    throw new RangeError("Independent method testing cannot silently rotate physical longitudes. Whole-chart rotation requires separately certified astronomy mapping.");
  }
  const teamA = input.favoredTeam ?? input.teamA;
  const teamB = input.underdogTeam ?? input.teamB;
  const roleAssignmentSource = input.roleAssignmentSource ??
    (input.favoredTeam && input.underdogTeam ? (input.oddsSource ? "market-odds" : "manual") : "legacy-side-order");
  const game: GameInput = {
    teamA, teamB, gameType: input.sport, location: input.location,
    startTime: date,
    ...(input.latitude !== undefined && input.longitude !== undefined
      ? { coordinates: { latitude: input.latitude, longitude: input.longitude } } : {}),
    ...(input.sunriseTime ? { sunriseTime: new Date(input.sunriseTime) } : {}),
    ...(input.sunriseSource ? { sunriseSource: input.sunriseSource } : {}),
    ...(input.agentViewModel ? { agentViewModel: input.agentViewModel } : {}),
  };
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
    const makeFrame = (frame: "god" | "agent"): SingleMethodFrame => {
      const prediction = frame === "god" ? godPrediction : agentPrediction;
      const anchor = frame === "agent" && input.agentViewRotation === "ascendant-only"
        ? (agentPrediction.ascendantLongitude + 180) % 360 : undefined;
      const snapshot = buildMethodChartSnapshot(prediction, date, frame, anchor);
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
        result: method.evaluable ? scoreOutcome(scoreA, scoreB) : "MISSING_INPUT",
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
  const independentStatus = classify(methodId);
  const incomplete = god.result === "MISSING_INPUT" || agent.result === "MISSING_INPUT";
  const status = incomplete ? "NOT_EVALUABLE" as const : independentStatus.status;
  const ready = !incomplete && status === "READY_FOR_EXPERIMENT" &&
    god.result !== "EVIDENCE_ONLY" && agent.result !== "EVIDENCE_ONLY";
  const a = ready ? round((god.scoreA! + agent.scoreA!) / 2) : null;
  const b = ready ? round((god.scoreB! + agent.scoreB!) / 2) : null;
  const bothNoTrigger = god.result === "NO_QUALIFYING_CONDITION" && agent.result === "NO_QUALIFYING_CONDITION";
  const eitherUnknownZero = god.result === "ZERO_NET_UNRESOLVED" || agent.result === "ZERO_NET_UNRESOLVED";
  const combinedResult: SingleMethodFrame["result"] = !ready ? (incomplete ? "MISSING_INPUT" : "EVIDENCE_ONLY")
    : a === 0 && b === 0 ? (bothNoTrigger ? "NO_QUALIFYING_CONDITION" : eitherUnknownZero ? "ZERO_NET_UNRESOLVED" : "EQUAL_SCORES")
    : scoreOutcome(a, b);
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
    methodId, methodName: spec.name, methodFamily: spec.family,
    frameMethodStatus: status,
    certification: "NOT_CERTIFIED",
    methodologyNotes: independentStatus.notes,
    event: { teamA, teamB, startTime: date.toISOString(), sport: input.sport,
      oddsSource: input.oddsSource ?? null, roleAssignmentSource },
    god, agent,
    combined: {
      scoreA: a, scoreB: b, difference: a !== null && b !== null ? round(a - b) : null,
      result: combinedResult,
      calculation: "Per-method cross-frame comparison: average corresponding God/Agent scores WITHOUT including any other named method. Excluded/uncertified methods retain raw per-frame evidence but cannot generate a certified combined verdict.",
    },
    actualWinner, comparison,
  };
}
