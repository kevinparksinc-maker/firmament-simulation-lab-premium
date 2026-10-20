import type { SynthesisPrediction, SynthesisSide } from "./crossFrameSynthesis";
import { METHOD_REGISTRY, type MethodResult } from "./methodRegistry";
import { EXPECTED_METHOD_COUNT, UNIVERSAL_ASPECT_ORB_DEGREES } from "./frameworkContract";

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
  status: "COUNTED" | "MISSING_INPUT" | "NOT_EVALUABLE" | "POLICY_CONFLICT" | "INVALID_PARITY";
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

  const coreRows: ExpandedMethodRow[] = core.methods.map((method, index) => ({
    id: `CORE_${String(index + 1).padStart(2, "0")}`,
    name: method.name,
    family: "Core 21",
    source: "core",
    executedGod: true,
    executedAgent: true,
    scoreGodA: method.godScoreA,
    scoreGodB: method.godScoreB,
    scoreAgentA: method.agentScoreA,
    scoreAgentB: method.agentScoreB,
    prediction: method.winner,
    vote: voteFor(method.winner),
    counted: parity,
    status: parity ? "COUNTED" : "INVALID_PARITY",
    reason: parity ? "Equal-ballot research vote; also retained in original weighted 21-method baseline." : "Full frame/registry parity is invalid; expanded result withheld.",
    certification: "NOT_CERTIFIED",
    calculationVersion: "CORE_21_SNAPSHOT",
    evidence: ["Core score is available in godView/agentView proof.methodWalkthrough; check scored operands, not merely the chart inventory."],
  }));

  const extraRows: ExpandedMethodRow[] = METHOD_REGISTRY.map(spec => {
    const g = god.get(spec.id), a = agent.get(spec.id);
    // V1's variable 1.5-6 degree Gaussian orbs violate the user-wide 5 degree linear policy.
    const policyConflict = spec.id === "HARMONICS_V1";
    const missingNatal = spec.id === "NATAL_VIMSHOTTARI_V1" && (!usable(g) || !usable(a));
    const good = usable(g) && usable(a);
    const counted = parity && !policyConflict && good;
    const scoreA = good ? ((g!.scoreA! + a!.scoreA!) / 2) : 0;
    const scoreB = good ? ((g!.scoreB! + a!.scoreB!) / 2) : 0;
    const winner = good ? predictionFor(scoreA, scoreB) : "NONE";
    const status: ExpandedMethodRow["status"] = !parity ? "INVALID_PARITY" :
      policyConflict ? "POLICY_CONFLICT" : missingNatal ? "MISSING_INPUT" :
      !good ? "NOT_EVALUABLE" : "COUNTED";
    const reason = policyConflict
      ? "V1 uses Gaussian weights and varying orbs up to 6 degrees. Executed for comparison, but NOT counted until it meets the universal 5 degree policy; HARMONICS_V2 remains eligible."
      : missingNatal
      ? "A natal Moon and verified birth time are required; an event chart cannot stand in for an unknown birth chart."
      : !good
      ? "One or both frames lack a finite, evaluable predictive score. No zero-valued substitute is assigned."
      : counted
      ? "Both frames are evaluable; one equal-weight experimental ballot is counted. Mathematics and sports mapping remain uncertified."
      : "Expanded parity failed: do not issue a result.";
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
        "Full chart inventories are evidence context, not proof each body/house was included in this method's scoring.",
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
