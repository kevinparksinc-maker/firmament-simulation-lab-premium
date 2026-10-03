import { describe, expect, it } from "vitest";
import { generateFixedJ2000KPPrediction } from "./firmamentEngine";
import { METHOD_REGISTRY, runMethod, runRegisteredMethods } from "./methodRegistry";
import { universalLinearResonance } from "./experimentalLayers";

const input = {
  teamA: "Los Angeles Dodgers",
  teamB: "San Francisco Giants",
  gameType: "MLB" as const,
  location: "Los Angeles, CA",
  coordinates: { latitude: 34.0522, longitude: -118.2437 },
  startTime: new Date("2024-06-15T19:10:00.000Z"),
};

describe("method registry and HARMONICS_V2", () => {
  it("implements the specified 5-degree linear boundary", () => {
    expect(universalLinearResonance(0)).toBeCloseTo(1, 10);
    expect(universalLinearResonance(1)).toBeCloseTo(0.8, 10);
    expect(universalLinearResonance(2)).toBeCloseTo(0.6, 10);
    expect(universalLinearResonance(3)).toBeCloseTo(0.4, 10);
    expect(universalLinearResonance(4)).toBeCloseTo(0.2, 10);
    expect(universalLinearResonance(5)).toBe(0);
    expect(universalLinearResonance(5.0001)).toBe(0);
  });

  it("registers versioned V1 and V2 harmonic models without replacing V1", () => {
    expect(METHOD_REGISTRY.find((method) => method.id === "HARMONICS_V1")?.version).toBe("1.0.0");
    expect(METHOD_REGISTRY.find((method) => method.id === "HARMONICS_V2")?.version).toBe("2.0.0");
    const prediction = generateFixedJ2000KPPrediction(input);
    const base = { prediction, eventTime: input.startTime };
    const v1 = runMethod("HARMONICS_V1", base);
    const v2 = runMethod("HARMONICS_V2", base);
    expect(v1.calculationVersion).toBe("1.0.0");
    expect(v2.calculationVersion).toBe("2.0.0");
    expect(v1.methodId).not.toBe(v2.methodId);
  });

  it("returns nullable scores for non-evaluable natal Dasha without natal context", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const result = runMethod("NATAL_VIMSHOTTARI_V1", { prediction, eventTime: input.startTime });
    expect(result.mode).toBe("PREDICTIVE");
    expect(result.evaluable).toBe(false);
    expect(result.scoreA).toBeNull();
    expect(result.scoreB).toBeNull();
    expect(result.prediction).toBe("NONE");
  });

  it("runs the initial registry phase against one canonical input", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const results = runRegisteredMethods({ prediction, eventTime: input.startTime });
    expect(results.length).toBeGreaterThanOrEqual(9);
    expect(results.every((result) => result.methodId && result.calculationVersion)).toBe(true);
  });
});
