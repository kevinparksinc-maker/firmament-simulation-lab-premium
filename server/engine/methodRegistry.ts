import {
  calculateAshtakavargaLayer,
  calculateDashaLayer,
  calculateHarmonicSpectrum,
  calculateHarmonicSpectrumV2,
  calculateVargaLayer,
  DEFAULT_HARMONICS,
  DEFAULT_HARMONICS_V2,
  type ExperimentalLayerVerdict,
  type HarmonicConfig,
} from "./experimentalLayers";
import type { Prediction } from "./firmamentEngine";
import { DEFAULT_CHINESE_MANSIONS, buildChineseMansionEvidence } from "./chineseMansions";
import { buildMethodChartSnapshot, type MethodChartSnapshot } from "./methodChartSnapshot";

export type MethodMode = "PREDICTIVE" | "EVIDENCE_ONLY";
export type MethodPrediction = "A" | "B" | "TIE" | "NONE";
export type RequiredInput = "prediction" | "eventTime" | "natalContext";
export type MethodEvidence = {
  type: string;
  planet?: string;
  house?: number;
  aspect?: string;
  orb?: number;
  resonance?: number;
  value?: number;
  explanation: string;
};
export type MethodInput = {
  prediction: Prediction;
  eventTime: Date;
  natalContext?: { prediction: Prediction; birthTime: Date };
};
export type MethodResult = {
  methodId: string;
  mode: MethodMode;
  evaluable: boolean;
  scoreA: number | null;
  scoreB: number | null;
  prediction: MethodPrediction;
  confidence: number | null;
  evidence: MethodEvidence[];
  detail: string;
  calculationVersion: string;
};
export type MethodSpec = {
  id: string;
  name: string;
  family: string;
  version: string;
  mode: MethodMode;
  requiredInputs: readonly RequiredInput[];
  configuration: Readonly<Record<string, unknown>>;
  run(input: MethodInput): MethodResult;
};

function resultFromVerdict(spec: Pick<MethodSpec, "id" | "mode" | "version">, verdict: ExperimentalLayerVerdict): MethodResult {
  const evaluable = spec.mode === "PREDICTIVE" && verdict.winner !== "NOT_EVALUABLE" && Number.isFinite(verdict.scoreA) && Number.isFinite(verdict.scoreB) && Number.isFinite(verdict.confidence);
  const evidence = verdict.evidence.map((item) => ({ type: "layer-evidence", value: Number.isFinite(Number(item.value)) ? Number(item.value) : undefined, explanation: `${item.label}: ${item.value}` }));
  return {
    methodId: spec.id,
    mode: spec.mode,
    evaluable,
    scoreA: spec.mode === "PREDICTIVE" && evaluable ? verdict.scoreA : null,
    scoreB: spec.mode === "PREDICTIVE" && evaluable ? verdict.scoreB : null,
    prediction: spec.mode === "PREDICTIVE" && evaluable ? verdict.winner === "NOT_EVALUABLE" ? "NONE" : verdict.winner : "NONE",
    confidence: spec.mode === "PREDICTIVE" && evaluable ? verdict.confidence : null,
    evidence,
    detail: verdict.rationale.join(" "),
    calculationVersion: spec.version,
  };
}

const withConfig = (config: readonly HarmonicConfig[]) => Object.freeze(config.map((entry) => ({ ...entry })));

export const METHOD_REGISTRY: readonly MethodSpec[] = Object.freeze([
  {
    id: "CHINESE_28_XIU_STELLAR_RA_V1",
    name: "Chinese 28 mansions — determinative-star J2000 evidence",
    family: "Chinese lunar mansions",
    version: "1.0.0",
    mode: "EVIDENCE_ONLY",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { frame: "ICRS_J2000", source: DEFAULT_CHINESE_MANSIONS.source, count: 28 },
    run: input => {
      const trace = buildChineseMansionEvidence(input.prediction.planets.map(planet => ({ planet: planet.planet, house: planet.house, j2000RaDegrees: planet.j2000RaDegrees })), DEFAULT_CHINESE_MANSIONS);
      return { methodId: "CHINESE_28_XIU_STELLAR_RA_V1", mode: "EVIDENCE_ONLY", evaluable: trace.assignments.length > 0, scoreA: null, scoreB: null, prediction: "NONE", confidence: null, evidence: trace.assignments.map(item => ({ type: "chinese-mansion", planet: item.planet, house: item.house, value: item.mansion.index, explanation: item.planet + " in " + item.mansion.pinyin + " (" + item.mansion.hanzi + "), " + item.mansion.quadrant + "; RA " + item.rightAscensionDegrees.toFixed(4) + "°, mansion distance " + item.degreesIntoMansion.toFixed(4) + "°" })), detail: "Each chart body is assigned through verified J2000 determinative-star right ascensions. No unvalidated predictive effects are inferred.", calculationVersion: "1.0.0" };
    },
  },
  {
    id: "HARMONICS_V1",
    name: "H2-H12 harmonic family coherence (Gaussian, calibrated orbs)",
    family: "Harmonics",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { model: "GAUSSIAN", harmonics: withConfig(DEFAULT_HARMONICS) },
    run: (input) => resultFromVerdict(METHOD_REGISTRY[1]!, calculateHarmonicSpectrum(input.prediction, DEFAULT_HARMONICS).verdict),
  },
  {
    id: "HARMONICS_V2",
    name: "H2-H12 harmonic family coherence (universal 5-degree linear)",
    family: "Harmonics",
    version: "2.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { model: "LINEAR", maxOrbDeg: 5, harmonics: withConfig(DEFAULT_HARMONICS_V2) },
    run: (input) => resultFromVerdict(METHOD_REGISTRY[2]!, calculateHarmonicSpectrumV2(input.prediction, DEFAULT_HARMONICS_V2).verdict),
  },
  ...([3, 9, 10, 27, 30] as const).map((division) => ({
    id: `VARGA_D${division}_V1`,
    name: `D${division} independent structural placement`,
    family: "Vargas",
    version: "1.0.0",
    mode: "PREDICTIVE" as const,
    requiredInputs: ["prediction", "eventTime"] as const,
    configuration: { division, mapping: division === 3 ? "PARASHARI" : division === 9 ? "PARASHARI_NAVAMSA" : division === 10 ? "PARASHARI_DASAMSA" : division === 27 ? "TRADITIONAL_ELEMENTAL_BASELINE" : "PARASHARI_TRIMSAMSA" },
    run: (input: MethodInput) => {
      const verdict = calculateVargaLayer(input.prediction, [division]).verdict;
      return resultFromVerdict({ id: `VARGA_D${division}_V1`, mode: "PREDICTIVE", version: "1.0.0" }, verdict);
    },
  })),
  {
    id: "ASHTAKAVARGA_V1",
    name: "Classical BAV/SAV positional support",
    family: "Ashtakavarga",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { references: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"], excludes: ["Rahu", "Ketu"] },
    run: (input) => resultFromVerdict({ id: "ASHTAKAVARGA_V1", mode: "PREDICTIVE", version: "1.0.0" }, calculateAshtakavargaLayer(input.prediction).verdict),
  },
  {
    id: "EVENT_LUNAR_DASHA_CHAIN_V1",
    name: "Event-time Nakshatra/Sub/Sub-Sub chain",
    family: "Dasha",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { natalContext: false, chain: ["Nakshatra", "Sub", "Sub-Sub"] },
    run: (input) => resultFromVerdict({ id: "EVENT_LUNAR_DASHA_CHAIN_V1", mode: "PREDICTIVE", version: "1.0.0" }, calculateDashaLayer(input.prediction, input.eventTime).verdict),
  },
  {
    id: "NATAL_VIMSHOTTARI_V1",
    name: "Natal Vimshottari Mahadasha/Antardasha/Pratyantardasha",
    family: "Dasha",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime", "natalContext"],
    configuration: { sequenceYears: 120, levels: ["mahadasha", "antardasha", "pratyantardasha"] },
    run: (input) => resultFromVerdict({ id: "NATAL_VIMSHOTTARI_V1", mode: "PREDICTIVE", version: "1.0.0" }, calculateDashaLayer(input.prediction, input.eventTime, undefined, input.natalContext).verdict),
  },
]);

export function getMethodSpec(methodId: string) { return METHOD_REGISTRY.find((method) => method.id === methodId); }
export function runMethod(methodId: string, input: MethodInput): MethodResult {
  const method = getMethodSpec(methodId);
  if (!method) throw new Error(`Unknown method: ${methodId}`);
  if (method.requiredInputs.includes("natalContext") && !input.natalContext) {
    return { methodId: method.id, mode: method.mode, evaluable: false, scoreA: null, scoreB: null, prediction: "NONE", confidence: null, evidence: [], detail: "Natal context is required for this method.", calculationVersion: method.version };
  }
  if (!Number.isFinite(input.eventTime.getTime())) throw new Error("Invalid method event time");
  const result = method.run(input);
  if (result.methodId !== method.id || result.mode !== method.mode || result.calculationVersion !== method.version)
    throw new Error(`Method ${method.id} returned inconsistent doctrine metadata`);
  if (result.mode === "EVIDENCE_ONLY" && (result.scoreA !== null || result.scoreB !== null || result.prediction !== "NONE" || result.confidence !== null))
    throw new Error(`Evidence-only method ${method.id} attempted a predictive score`);
  if (result.mode === "PREDICTIVE" && result.evaluable && (!Number.isFinite(result.scoreA) || !Number.isFinite(result.scoreB) || !Number.isFinite(result.confidence)))
    throw new Error(`Predictive method ${method.id} returned invalid scores`);
  return result;
}
export function runRegisteredMethodsFromSnapshot(snapshot: MethodChartSnapshot, methodIds = METHOD_REGISTRY.map((method) => method.id), natalContext?: MethodInput["natalContext"]) {
  return methodIds.map((methodId) => runMethod(methodId, {
    prediction: snapshot.prediction,
    // Method-specific timing doctrine sees the event time but cannot advance
    // the shared snapshot clock for the next method.
    eventTime: new Date(snapshot.eventTime.getTime()),
    natalContext,
  }));
}

/** Backward-compatible entry point; new simulations build each frame once. */
export function runRegisteredMethods(input: MethodInput, methodIds = METHOD_REGISTRY.map((method) => method.id)) {
  return methodIds.map((methodId) => runMethod(methodId, input));
}

export { buildMethodChartSnapshot };
