import { describe, expect, it } from "vitest";
import { auditNeutralMethod } from "./neutralMethodAudit";
import { runSimulationEvent } from "./simulationAdapter";

describe("neutral method audit", () => {
  it("distinguishes a valid neutral calculation from an unexplained zero", () => {
    expect(auditNeutralMethod({
      name: "Fixed-star amplifications",
      scoreA: 0,
      scoreB: 0,
      ruleClass: "SIDE_SPECIFIC",
      detail: "No recovered-archive fixed-star conjunctions within the stated 1° orb.",
      calculation: { formula: "Σ star weight by house-lord side", inputs: ["No star input met the 1° orb."], steps: ["No qualifying input."] },
    }).status).toBe("valid-neutral");
    expect(auditNeutralMethod({ name: "Broken method", scoreA: 0, scoreB: 0 }).status).toBe("unexplained");
  });

  it("flags shared evidence and hard-coded neutral logic separately", () => {
    expect(auditNeutralMethod({
      name: "Mutual reception",
      scoreA: 0,
      scoreB: 0,
      ruleClass: "SHARED",
      detail: "Recorded as evidence only — mutual reception strengthens both, favors neither.",
      calculation: { formula: "contribution fixed at 0 / 0", inputs: [], steps: [] },
    }).status).toBe("shared-evidence-only");
    expect(auditNeutralMethod({
      name: "Moon phase / VOC",
      scoreA: 0,
      scoreB: 0,
      ruleClass: "SHARED",
      detail: "void-of-course remains false / 0 points",
      calculation: { formula: "Environment-only", inputs: [], steps: [] },
    }).status).toBe("hard-coded-neutral");
  });

  it("requires a missing-input explanation instead of silently accepting zero", () => {
    expect(auditNeutralMethod({ name: "Moon phase / VOC", scoreA: 0, scoreB: 0, detail: "Sun or Moon unavailable." }).status).toBe("missing-input");
  });

  it("classifies every zero-output layer in a real event trace", () => {
    const result = runSimulationEvent({
      teamA: "New York Yankees",
      teamB: "Houston Astros",
      sport: "MLB",
      location: "Houston, TX",
      latitude: 29.7604,
      longitude: -95.3698,
      startTime: "2024-04-02T00:10:00.000Z",
    });
    const layers = [...result.godView.allLayers, ...result.agentView.allLayers];
    const zeroLayers = layers.filter((layer) => layer.scoreA === 0 && layer.scoreB === 0);
    expect(zeroLayers.length).toBeGreaterThan(0);
    expect(zeroLayers.every((layer) => layer.neutralDiagnostic.status !== "unexplained")).toBe(true);
    expect(zeroLayers.some((layer) => layer.neutralDiagnostic.status === "hard-coded-neutral")).toBe(true);
  });
});
