import type { SynthesisPrediction, SynthesisSide } from "./crossFrameSynthesis";
import { METHOD_REGISTRY, type MethodResult } from "./methodRegistry";
import { EXPECTED_METHOD_COUNT, UNIVERSAL_ASPECT_ORB_DEGREES } from "./frameworkContract";
import { getMethodCertificationGate } from "./methodCertificationPolicy";

/**
 * Pre-registered, equal-ballot 31-line challenger. The existing 21-method
 * score-weighted baseline is NEVER overwritten. A ballot avoids adding BAV
 * bindus, harmonic coherences and KP scores with incompatible raw units.
 *
 * Running a method is not proof of doctrinal correctness. No method is
 * certified by this adapter, and this is NOT a calibrated win probability.
 */
export type ExpandedMethodRow = {
  id: string;
  name: string;
  family: string;
  source: "core" | "registry";
  executedGod: boolean;
  executedAgent: boolean;
  scoreGodA: number | null;
  scoreGodB: number | null;
  scoreAgentA: number | null;
  scoreAgentB: number | null;
  prediction: SynthesisSide | "NONE";
  vote: -1 | 0 | 1;
  counted: boolean;
  status: "COUNTED" | "MISSING_INPUT" | "NOT_EVALUABLE" | "NO_QUALIFYING_CONDITION" | "ZERO_NET_UNRESOLVED" | "POLICY_CONFLICT" | "INCOMPLETE_DOCTRINE" | "INVALID_PARITY";
  reason: string;
  certification: "NOT_CERTIFIED";
  calculationVersion: string;
  evidence: string[];
};

export type ExpandedMethodExperiment = {
  version: "EXPANDED_31_RESEARCH_V1";
  status: "EXPERIMENTAL_NOT_CERTIFIED";
  methodCount: number;
  countedMethods: number;
  excludedMethods: number;
  voteA: number;
  voteB: number;
  winner: SynthesisSide;
  baseline21Winner: SynthesisSide;
  valid: boolean;
  reason: string;
  formula: string;
  requirements: {
    supportedHouses: number;
    supportedBodies: number;
    aspectOrbDegrees: number;
    scoringTraceCertified: boolean;
    historicalValidityCertified: boolean;
  };
  methods: ExpandedMethodRow[];
};

const predictionFor = (a: number, b: number): SynthesisSide =>
  Math.abs(a - b) < 1e-9 ? "TIE" : a > b ? "A" : "B";
const voteFor = (winner: SynthesisSide | "NONE"): -1 | 0 | 1 => winner === "A" ? 1 : winner === "B" ? -1 : 0;
const usable = (result: MethodResult | undefined) =>
  Boolean(result && result.evaluable && result.mode === "PREDICTIVE" &&
    result.scoreA !== null && result.scoreB !== null &&
    Number.isFinite(result.scoreA) && Number.isFinite(result.scoreB) &&
    result.prediction !== "NONE");

export function buildExpandedMethodExperiment(
  core: SynthesisPrediction,
  godMethods: readonly MethodResult[],
  agentMethods: readonly MethodResult[],
  houseCount: number,
  bodyCount: number,
): ExpandedMethodExperiment {
  const expected = EXPECTED_METHOD_COUNT + METHOD_REGISTRY.length;
  const god = new Map(godMethods.map(method => [method.methodId, method]));
  const agent = new Map(agentMethods.map(method => [method.methodId, method]));
  const parity = core.valid &&
    godMethods.length === METHOD_REGISTRY.length &&
    agentMethods.length === METHOD_REGISTRY.length &&
    god.size === METHOD_REGISTRY.length &&
    agent.size === METHOD_REGISTRY.length &&
    METHOD_REGISTRY.every(spec => god.has(spec.id) && agent.has(spec.id));

  const coreRows: ExpandedMethodRow[] = core.methods.map((method, index) => {
    const id = `CORE_${String(index + 1).padStart(2, "0")}`;
    const gate = getMethodCertificationGate(id);
    const hasSignal = [method.godScoreA, method.godScoreB, method.agentScoreA, method.agentScoreB].some(v => v !== 0);
    // Zero across both frames is ambiguous without a scored-event trigger
    // ledger: it might be no trigger OR canceled positive/negative terms.
    const status: ExpandedMethodRow["status"] = !parity ? "INVALID_PARITY"
      : gate.status !== "READY_FOR_EXPERIMENT" ? gate.status
      : hasSignal ? "COUNTED" : "ZERO_NET_UNRESOLVED";
    const counted = status === "COUNTED";
    return {
      id, name: method.name, family: "Core 21", source: "core" as const,
      executedGod: true, executedAgent: true,
      scoreGodA: method.godScoreA, scoreGodB: method.godScoreB,
      scoreAgentA: method.agentScoreA, scoreAgentB: method.agentScoreB,
      prediction: method.winner,
      vote: counted ? voteFor(method.winner) : 0 as const,
      counted, status,
      reason: !parity ? "Full frame/registry parity invalid."
        : gate.status !== "READY_FOR_EXPERIMENT" ? gate.reasons.join(" ")
        : !hasSignal ? "Raw 0/0 in BOTH frames; missing trigger/cancellation proof. Not a confirmed tied-strength reading."
        : "Both frames recorded numeric evidence. Equal-ballot comparison is research-only and not a certificate.",
      certification: "NOT_CERTIFIED" as const,
      calculationVersion: "CORE_21_SNAPSHOT",
      evidence: ["Detailed core formulas/inputs/steps are supplied by the God/Agent method walkthrough. A full-chart inventory by itself does not establish which operands scored."],
    };
  });

  const extraRows: ExpandedMethodRow[] = METHOD_REGISTRY.map(spec => {
    const g = god.get(spec.id), a = agent.get(spec.id);
    const gate = getMethodCertificationGate(spec.id);
    const good = usable(g) && usable(a);
    const missingNatal = spec.id === "NATAL_VIMSHOTTARI_V1" && !good;
    const ambiguousZero = good && [g!.scoreA, g!.scoreB, a!.scoreA, a!.scoreB].every(value => value === 0);
    const status: ExpandedMethodRow["status"] = !parity ? "INVALID_PARITY" :
      missingNatal ? "MISSING_INPUT" :
      !good ? "NOT_EVALUABLE" :
      gate.status !== "READY_FOR_EXPERIMENT" ? gate.status :
      ambiguousZero ? "ZERO_NET_UNRESOLVED" : "COUNTED";
    const counted = status === "COUNTED";
    const scoreA = good ? ((g!.scoreA! + a!.scoreA!) / 2) : null;
    const scoreB = good ? ((g!.scoreB! + a!.scoreB!) / 2) : null;
    const winner = good ? predictionFor(scoreA!, scoreB!) : "NONE";
    const reason = !parity ? "Frame/method parity invalid." :
      missingNatal ? "Natal Moon and verified birth time are required; an event chart cannot stand in for a missing birth chart." :
      !good ? "One or both frames lack a finite, evaluable predictive score. Missing values remain null, never fabricated as zero." :
      gate.status !== "READY_FOR_EXPERIMENT" ? gate.reasons.join(" ") :
      ambiguousZero ? "Numeric 0/0 was returned by both frames, but no trigger ledger proves whether conditions were absent or points canceled. Audit required." :
      "Both frames have a numeric directional comparison. One experimental equal ballot counted; underlying sports mapping remains uncertified.";
    return {
      id: spec.id, name: spec.name, family: spec.family, source: "registry" as const,
      executedGod: Boolean(g), executedAgent: Boolean(a),
      scoreGodA: g?.scoreA ?? null, scoreGodB: g?.scoreB ?? null,
      scoreAgentA: a?.scoreA ?? null, scoreAgentB: a?.scoreB ?? null,
      prediction: good ? winner : "NONE" as const,
      vote: counted ? voteFor(winner) : 0 as const,
      counted, status, reason, certification: "NOT_CERTIFIED" as const,
      calculationVersion: spec.version,
      evidence: [
        ...(g?.evidence.map(e => `God: ${e.explanation}`) ?? []),
        ...(a?.evidence.map(e => `Agent: ${e.explanation}`) ?? []),
        "Complete-chart inventory is a reference, not proof that every body/house was scored.",
      ],
    };
  });
  const methods = [...coreRows, ...extraRows];
  const countIsCorrect = methods.length === expected && coreRows.length === EXPECTED_METHOD_COUNT;
  const valid = parity && countIsCorrect && houseCount === 12 && bodyCount >= 9;
  const countedMethods = valid ? methods.filter(row => row.counted).length : 0;
  const voteA = valid ? methods.filter(row => row.counted && row.vote === 1).length : 0;
  const voteB = valid ? methods.filter(row => row.counted && row.vote === -1).length : 0;
  return {
    version: "EXPANDED_31_RESEARCH_V1",
    status: "EXPERIMENTAL_NOT_CERTIFIED",
    methodCount: methods.length,
    countedMethods,
    excludedMethods: methods.length - countedMethods,
    voteA, voteB,
    winner: valid ? predictionFor(voteA, voteB) : "TIE",
    baseline21Winner: core.winner,
    valid,
    reason: !valid
      ? "Invalid 21-method parity, registry membership or chart inventory; experimental prediction withheld."
      : "Experimental 31-line research comparison. Uncertified methods, missing natal inputs and obsolete-orb models are explicitly identified. Equal ballots are a research assumption, not a validated forecast.",
    formula: "Each core/eligible registered method contributes ONE ballot according to the average of its God and Agent side scores. A>TIE/B yields +1/0/-1; A/B ballots are counted separately. No raw scores with incompatible scales are added, and unscorable methods abstain.",
    requirements: {
      supportedHouses: houseCount, supportedBodies: bodyCount,
      aspectOrbDegrees: UNIVERSAL_ASPECT_ORB_DEGREES,
      scoringTraceCertified: false, historicalValidityCertified: false,
    },
    methods,
  };
}
