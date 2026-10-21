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

  it("does not promote legacy unsourced results into verified winning formulas", () => {
    const memory = getDefaultHistoricalMemory();
    const unverified = memory.map(row => ({ ...row, roleVerified: false }));
    const blocked = discoverPatterns(unverified, { minSupport: 2 });
    expect(blocked.rules).toHaveLength(0);
    expect(blocked.winningFormulas).toHaveLength(0);
    expect(blocked.upsetTraps).toHaveLength(0);
    // Memory can still supply chart similarities and forensic evidence. Pattern
    // winner hit-rates must wait for recorded point-in-time sportsbook sources.
    const actualDiscovery = discoverPatterns(memory, { minSupport: 2 });
    const sourceCount = memory.filter(row => row.roleVerified && row.actualWinner && row.actualWinner !== "TIE").length;
    if (sourceCount === 0) {
      expect(actualDiscovery.rules).toHaveLength(0);
    } else {
      expect(actualDiscovery.rules.every(rule => rule.verified > 0)).toBe(true);
    }
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
