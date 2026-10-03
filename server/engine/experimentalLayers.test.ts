import { describe, expect, it } from "vitest";
import { calculateAshtakavargaLayer, calculateExperimentalLayers, calculateHarmonic, calculateVimshottariDasha, DEFAULT_HOUSE_FAMILIES } from "./experimentalLayers";
import { generateFixedJ2000KPPrediction } from "./firmamentEngine";

const input = {
  teamA: "Los Angeles Dodgers",
  teamB: "San Francisco Giants",
  gameType: "MLB" as const,
  location: "Los Angeles, CA",
  coordinates: { latitude: 34.0522, longitude: -118.2437 },
  startTime: new Date("2024-06-15T19:10:00.000Z"),
};

describe("experimental evidence layers", () => {
  it("uses the specification house families rather than the live neutral-house clusters", () => {
    expect(DEFAULT_HOUSE_FAMILIES.sideA).toEqual([1, 2, 3, 6, 10, 11]);
    expect(DEFAULT_HOUSE_FAMILIES.sideB).toEqual([4, 5, 7, 8, 9, 12]);
  });

  it("calculates a configurable arbitrary harmonic with target-family residuals", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const result = calculateHarmonic(prediction.planets, { harmonic: 5, maxOrbDeg: 6, falloff: "gaussian", enabled: true });
    expect(result.harmonic).toBe(5);
    expect(result.pairs).toHaveLength(36);
    expect(result.pairs.every((pair) => pair.residual >= 0 && pair.residual <= 36)).toBe(true);
  });

  it("returns all four layers as experimental read-only evidence", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const result = calculateExperimentalLayers(prediction, input.startTime);
    expect(result.status).toBe("experimental-read-only");
    expect(result.verdicts).toHaveLength(4);
    expect(result.crossLayer.rationale.length).toBeGreaterThan(0);
    expect(result.harmonics.verdict.layer).toBe("harmonics");
    expect(result.harmonics.spectrum.map((row) => row.harmonic)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.varga.verdict.layer).toBe("varga");
    expect(result.varga.placements).toHaveLength(45);
    expect(result.ashtakavarga.verdict.layer).toBe("ashtakavarga");
    expect(result.ashtakavarga.rows).toHaveLength(7);
    expect(result.dasha.verdict.layer).toBe("dasha");
    expect(result.dasha.active?.starLord).toBeTruthy();
    expect(["A", "B", "TIE", "NOT_EVALUABLE"]).toContain(result.dasha.verdict.winner);
  });
});


describe("classical ashtakavarga and vimshottari", () => {
  it("matches the classical BAV row checksums and 337-point SAV checksum", () => {
    const prediction = generateFixedJ2000KPPrediction(input);
    const result = calculateAshtakavargaLayer(prediction);
    expect(result.rows.map((row) => row.total)).toEqual([48, 49, 39, 54, 56, 52, 39]);
    expect(result.sarvashtakavarga.total).toBe(337);
    expect(result.sarvashtakavarga.bindus.every((value) => value >= 0 && value <= 56)).toBe(true);
  });

  it("computes a natal Vimshottari chain from Moon longitude and birth epoch", () => {
    const birth = new Date("1990-02-11T09:00:00.000Z");
    const moonLongitude = 48;
    const result = calculateVimshottariDasha(moonLongitude, birth, new Date("2026-09-25T00:00:00.000Z"));
    expect(result).not.toBeNull();
    expect(result?.nakshatra).toBe("Rohini");
    expect(result?.starLord).toBe("Moon");
    expect(result?.balanceYears).toBeCloseTo(4, 5);
    expect(result?.mahadasha.level).toBe("mahadasha");
    expect(result?.antardasha.level).toBe("antardasha");
    expect(result?.pratyantardasha.level).toBe("pratyantardasha");
    expect(result?.mahadasha.start.getTime()).toBeGreaterThan(birth.getTime());
    expect(result?.mahadasha.end.getTime()).toBeGreaterThan(new Date("2026-09-25T00:00:00.000Z").getTime());
  });
});
