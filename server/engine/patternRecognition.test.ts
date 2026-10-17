import { describe, expect, it } from "vitest";
import {
  getDefaultHistoricalMemory,
  discoverPatterns,
  matchGamePatterns,
  analyzeGameForensic,
  extractPattern,
} from "./patternRecognition";
import { runSimulationEvent } from "./simulationAdapter";

describe("Pattern Recognition & Causal Forensics Engine", () => {
  it("loads authoritative multi-sport historical memory", () => {
    const memory = getDefaultHistoricalMemory();
    expect(memory.length).toBeGreaterThanOrEqual(12);
    // Every record must have core tokens
    const sample = memory[0];
    expect(sample.tokens.length).toBeGreaterThan(0);
    expect(sample.tokens.some((t: string) => t.startsWith("TERRITORY:"))).toBe(true);
    expect(sample.tokens.some((t: string) => t.startsWith("DECAN:"))).toBe(true);
    expect(sample.tokens.some((t: string) => t.startsWith("MOON:"))).toBe(true);
  });

  it("mines recurring winning formulas and upset traps", () => {
    const memory = getDefaultHistoricalMemory();
    const discovery = discoverPatterns(memory, { minSupport: 2 });
    expect(discovery.rules.length).toBeGreaterThan(0);
    expect(discovery.winningFormulas.length).toBeGreaterThan(0);
    expect(discovery.upsetTraps.length).toBeGreaterThan(0);

    const hitFormula = discovery.winningFormulas[0];
    expect(hitFormula.baselineAccuracy).toBeGreaterThanOrEqual(0.7);
    expect(hitFormula.ruleType).toBe("WINNING_FORMULA");

    const upsetTrap = discovery.upsetTraps[0];
    expect(upsetTrap.baselineAccuracy).toBeLessThanOrEqual(0.4);
    expect(upsetTrap.ruleType).toBe("UPSET_TRAP");
  });

  it("produces deep causal attribution post-mortem explaining why it happened", () => {
    const sim = runSimulationEvent({
      id: "cfb-test-01",
      teamA: "Michigan Wolverines",
      teamB: "Ohio State Buckeyes",
      sport: "NCAAF",
      location: "Michigan Stadium, Ann Arbor, MI",
      latitude: 42.2658,
      longitude: -83.7487,
      startTime: "2023-11-25T17:00:00Z",
      actualWinner: "A",
      roleAssignmentSource: "market-odds",
    });

    const forensic = analyzeGameForensic(sim);
    expect(["hit", "miss", "unverified"]).toContain(forensic.verdict);
    expect(forensic.causalAttribution.headline).toBeTruthy();
    expect(forensic.causalAttribution.tippingPoint).toBeTruthy();

    // Territorial Battle Core
    expect(forensic.territorialBattle.h1Lord.lord).toBeTruthy();
    expect(forensic.territorialBattle.h7Lord.lord).toBeTruthy();
    expect(forensic.territorialBattle.narrative).toBeTruthy();

    // Chaldean Decan Battle Core
    expect(forensic.decanBattle.advantage).toMatch(/A|B|EVEN/);
    expect(forensic.decanBattle.narrative).toBeTruthy();

    // Lunar Mansions Core
    expect(forensic.mansionBattle.moonManzil.name).toBeTruthy();
    expect(forensic.mansionBattle.moonNakshatra.name).toBeTruthy();
    expect(forensic.mansionBattle.narrative).toBeTruthy();
  });

  it("matches target game against memory and fires alerts and historical twins", () => {
    const memory = getDefaultHistoricalMemory();
    const target = runSimulationEvent({
      id: "target-live-event",
      teamA: "Texas Longhorns",
      teamB: "Oklahoma Sooners",
      sport: "NCAAF",
      location: "Cotton Bowl, Dallas, TX",
      latitude: 32.7797,
      longitude: -96.7599,
      startTime: "2024-10-12T19:30:00Z",
      roleAssignmentSource: "market-odds",
    });

    const matched = matchGamePatterns(target, memory);
    expect(matched.twins.length).toBeGreaterThan(0);
    expect(matched.twins[0].similarity).toBeGreaterThan(0);
    expect(matched.forensic).toBeDefined();
    expect(matched.activeAlerts).toBeDefined();
  });
});
