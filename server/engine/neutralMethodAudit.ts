export type NeutralMethodDiagnosticStatus =
  | "triggered"
  | "valid-neutral"
  | "shared-evidence-only"
  | "hard-coded-neutral"
  | "missing-input"
  | "unexplained";

export type NeutralMethodDiagnostic = {
  method: string;
  status: NeutralMethodDiagnosticStatus;
  reason: string;
  actionable: boolean;
};

type Layer = {
  name: string;
  scoreA: number;
  scoreB: number;
  ruleClass?: string;
  detail?: string;
  calculation?: { formula?: string; inputs?: string[]; steps?: string[] };
};

function textFor(layer: Layer) {
  return [layer.detail, layer.calculation?.formula, ...(layer.calculation?.inputs ?? []), ...(layer.calculation?.steps ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Classifies zero-differential layers without changing their scores.
 * This is an audit contract: a neutral output must either be explained by a
 * real calculation, explicitly shared evidence, or be flagged for work.
 */
export function auditNeutralMethod(layer: Layer): NeutralMethodDiagnostic {
  const text = textFor(layer);
  const hasOutput = Math.abs(layer.scoreA) > 0 || Math.abs(layer.scoreB) > 0;
  if (hasOutput) return { method: layer.name, status: "triggered", reason: "The method produced a directional contribution.", actionable: false };
  if (/unavailable|missing|requires/i.test(text)) return { method: layer.name, status: "missing-input", reason: layer.detail ?? "The method did not receive a required input.", actionable: true };
  if (/void-of-course remains false|todo/i.test(text)) return { method: layer.name, status: "hard-coded-neutral", reason: layer.detail ?? "The method is currently forced to a neutral output.", actionable: true };
  if (layer.ruleClass === "SHARED" && /evidence only|favors neither|environment-only|does not count toward the winner/i.test(text)) {
    return { method: layer.name, status: "shared-evidence-only", reason: layer.detail ?? "The method records shared context and is not allowed to move the A/B differential.", actionable: false };
  }
  if (/hard-coded|fixed at 0 \/ 0/i.test(text)) return { method: layer.name, status: "hard-coded-neutral", reason: layer.detail ?? "The method is currently forced to a neutral output.", actionable: true };
  if (layer.calculation && layer.detail) return { method: layer.name, status: "valid-neutral", reason: layer.detail, actionable: false };
  return { method: layer.name, status: "unexplained", reason: "Zero contribution without a complete calculation trace.", actionable: true };
}

export function auditNeutralMethods(layers: Layer[]) {
  return layers.map(auditNeutralMethod);
}
