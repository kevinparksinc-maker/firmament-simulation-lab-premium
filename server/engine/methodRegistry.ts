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
  const evaluable = verdict.winner !== "NOT_EVALUABLE";
  const evidence = verdict.evidence.map((item) => ({ type: "layer-evidence", value: Number.isFinite(Number(item.value)) ? Number(item.value) : undefined, explanation: `${item.label}: ${item.value}` }));
  return {
    methodId: spec.id,
    mode: spec.mode,
    evaluable,
    scoreA: spec.mode === "PREDICTIVE" ? verdict.scoreA : null,
    scoreB: spec.mode === "PREDICTIVE" ? verdict.scoreB : null,
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
    id: "HARMONICS_V1",
    name: "H2-H12 harmonic family coherence (Gaussian, calibrated orbs)",
    family: "Harmonics",
    version: "1.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { model: "GAUSSIAN", harmonics: withConfig(DEFAULT_HARMONICS) },
    run: (input) => resultFromVerdict(METHOD_REGISTRY[0]!, calculateHarmonicSpectrum(input.prediction, DEFAULT_HARMONICS).verdict),
  },
  {
    id: "HARMONICS_V2",
    name: "H2-H12 harmonic family coherence (universal 5-degree linear)",
    family: "Harmonics",
    version: "2.0.0",
    mode: "PREDICTIVE",
    requiredInputs: ["prediction", "eventTime"],
    configuration: { model: "LINEAR", maxOrbDeg: 5, harmonics: withConfig(DEFAULT_HARMONICS_V2) },
    run: (input) => resultFromVerdict(METHOD_REGISTRY[1]!, calculateHarmonicSpectrumV2(input.prediction, DEFAULT_HARMONICS_V2).verdict),
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
  return method.run(input);
}
export function runRegisteredMethods(input: MethodInput, methodIds = METHOD_REGISTRY.map((method) => method.id)) {
  return methodIds.map((methodId) => runMethod(methodId, input));
}
