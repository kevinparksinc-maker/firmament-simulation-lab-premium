/**
 * A SINGLE policy for individual methods and optional 31-line research fusion.
 * "READY_FOR_EXPERIMENT" is not a certificate of traditional-method
 * correctness, complete chart coverage or empirical predictive reliability.
 */
export type MethodCertificationGate =
  | "READY_FOR_EXPERIMENT"
  | "POLICY_CONFLICT"
  | "INCOMPLETE_DOCTRINE";

const GATES: Readonly<Record<string, {
  status: Exclude<MethodCertificationGate, "READY_FOR_EXPERIMENT">;
  reason: string;
}>> = Object.freeze({
  CORE_05: {
    status: "POLICY_CONFLICT",
    reason: "Planetary-war scorer uses a 3° proximity threshold and a research priority list. It does not implement the approved 5° policy or complete classical graha-yuddha doctrine.",
  },
  CORE_07: {
    status: "POLICY_CONFLICT",
    reason: "Arabic mansion scorer still uses continuous 1 − orb/5 weighting, not approved 100/80/60/40 banded weights; cross-side signals remain context only.",
  },
  CORE_09: {
    status: "POLICY_CONFLICT",
    reason: "Fixed-star scorer uses a 1° orb and a limited star catalogue; universal 5° treatment and star source need independent review.",
  },
  CORE_13: {
    status: "INCOMPLETE_DOCTRINE",
    reason: "Moon phase evidence does not establish actual Moon void-of-course using applying aspects and ingress timing.",
  },
  CORE_17: {
    status: "INCOMPLETE_DOCTRINE",
    reason: "Besiegement is a geometrical proxy and lacks complete applying/separating motion and planetary ordering.",
  },
  CORE_19: {
    status: "INCOMPLETE_DOCTRINE",
    reason: "Translation of light needs verified applying/separating velocity and precise traditional perfection rules.",
  },
  CORE_20: {
    status: "POLICY_CONFLICT",
    reason: "Harmonious/friction still applies continuous 1 − orb/5 weighting and does not independently score every eligible house-cusp relationship under 100/80/60/40 bands.",
  },
  HARMONICS_V1: {
    status: "POLICY_CONFLICT",
    reason: "The original Gaussian harmonic spectrum uses variable max orbs from 1.5° to 6°, violating the unified 5° method policy.",
  },
});

export function getMethodCertificationGate(methodId: string): {
  status: MethodCertificationGate;
  reasons: string[];
  certified: false;
} {
  const issue = GATES[methodId];
  return issue
    ? { status: issue.status, reasons: [issue.reason], certified: false }
    : { status: "READY_FOR_EXPERIMENT", reasons: [
        "The method may run for diagnostics, but exact doctrine, all 12 house/body scoring, 100/80/60/40 bands and predictive usefulness are NOT independently certified.",
      ], certified: false };
}
