import { describe, expect, it } from "vitest";
import {
  calculateAscendantLongitude,
  calculateLegacyWestHorizonLongitude,
  ASCENDANT_HORIZON_VERSION,
} from "./firmamentEngine";
import { runSingleMethodEvent, INDEPENDENT_METHOD_FIELDS } from "./isolatedMethodRunner";
import { locateInHouse } from "./houseFrameFoundation";

/**
 * Historic-fight SIDE-ANCHOR AB experiment.
 * Event date and venue verified; 12:00 JST (03:00 UTC) is approximate.
 * Legacy reconstructed via deliberate 180° ascendant-only rotation, which
 * reproduces old west-horizon house placement for each selected method.
 * Not a frozen full-old-engine replay: CORE_21 KP upstream can differ.
 *
 * This is an astronomical geometry and calculation-coverage regression,
 * NOT an assertion of sporting predictive significance from one game.
 */
describe("Tyson vs Douglas: one event, 31 methods, old-west vs new-east", () => {
  it("prints the raw paired 31-row audit without blending methods or inventing scores", () => {
    const event = {
      id: "tyson-douglas-1990-02-11-tokyo-noon",
      teamA: "Mike Tyson", teamB: "James Buster Douglas",
      favoredTeam: "Mike Tyson", underdogTeam: "James Buster Douglas",
      roleAssignmentSource: "manual" as const,
      sport: "boxing" as const,
      location: "Tokyo Dome, Bunkyo, Tokyo, Japan",
      latitude: 35.7056, longitude: 139.7519,
      startTime: "1990-02-11T03:00:00.000Z",
      actualWinner: "B" as const,
    };
    const date = new Date(event.startTime);
    const eastAsc = calculateAscendantLongitude(date, event.latitude, event.longitude);
    const westAsc = calculateLegacyWestHorizonLongitude(date, event.latitude, event.longitude);
    const norm = (degrees: number) => (degrees % 360 + 360) % 360;
    expect(norm(eastAsc - westAsc)).toBeCloseTo(180, 9);
    expect(INDEPENDENT_METHOD_FIELDS).toHaveLength(31);

    const rows = INDEPENDENT_METHOD_FIELDS.map(method => {
      const east = runSingleMethodEvent(event, method.id);
      const west = runSingleMethodEvent({
        ...event, agentViewRotation: "ascendant-only" as const,
      }, method.id);
      // Two modes have identical God View planetary geometry.
      expect(east.god.chart).toEqual(west.god.chart);
      expect(east.god.scoreA).toBe(west.god.scoreA);
      expect(east.god.scoreB).toBe(west.god.scoreB);
      expect(east.agentAscendantModelVersion).toBe(ASCENDANT_HORIZON_VERSION);
      expect(west.agentAscendantModelVersion).toBe(ASCENDANT_HORIZON_VERSION);

      // Confirm the 180° family swap for the body inventory on both charts.
      for (const body of east.agent.chart.bodies) {
        const prior = west.agent.chart.bodies.find(p => p.planet === body.planet);
        expect(prior).toBeDefined();
        expect(prior!.longitude).toBeCloseTo(body.longitude, 7);
        expect(body.house).toBe(locateInHouse(body.longitude, "agent", eastAsc).house);
        expect(prior!.house).toBe(locateInHouse(body.longitude, "agent", westAsc).house);
      }

      const numLead = (a: number|null, b: number|null) =>
        a === null || b === null ? "NOT_EVALUABLE" : a > b ? "A" : b > a ? "B" : "EQUAL";
      return {
        id: method.id, name: method.name,
        westAgentA: west.agent.scoreA, westAgentB: west.agent.scoreB,
        eastAgentA: east.agent.scoreA, eastAgentB: east.agent.scoreB,
        westSynthesisA: west.combined.scoreA, westSynthesisB: west.combined.scoreB,
        eastSynthesisA: east.combined.scoreA, eastSynthesisB: east.combined.scoreB,
        westLead: numLead(west.combined.scoreA, west.combined.scoreB),
        eastLead: numLead(east.combined.scoreA, east.combined.scoreB),
        westStatus: west.frameMethodStatus, eastStatus: east.frameMethodStatus,
        historicalReplayCaveat: method.id === "CORE_21"
          ? "KP-dependent legacy replay is approximate, not source-exact"
          : null,
      };
    });
    const changedAgentScores = rows.filter(row =>
      row.westAgentA !== row.eastAgentA || row.westAgentB !== row.eastAgentB);
    const changedSynthesis = rows.filter(row =>
      row.westSynthesisA !== row.eastSynthesisA ||
      row.westSynthesisB !== row.eastSynthesisB);
    const changedLeader = rows.filter(row => row.westLead !== row.eastLead);
    const directions = (version: "west" | "east") => ({
      a: rows.filter(r => r[version === "west" ? "westLead" : "eastLead"] === "A").length,
      b: rows.filter(r => r[version === "west" ? "westLead" : "eastLead"] === "B").length,
      equal: rows.filter(r => r[version === "west" ? "westLead" : "eastLead"] === "EQUAL").length,
      missing: rows.filter(r => r[version === "west" ? "westLead" : "eastLead"] === "NOT_EVALUABLE").length,
    });
    const summary = {
      event: event.id, localStart: "1990-02-11 12:00 JST (approximate)",
      favoriteA: event.teamA, underdogB: event.teamB, actualWinner: "B",
      eastZeroTiltLongitude: Number(eastAsc.toFixed(6)),
      westLegacyLongitude: Number(westAsc.toFixed(6)),
      methods: rows.length,
      changedAgentScores: changedAgentScores.length,
      changedSynthesis: changedSynthesis.length,
      changedRawLeader: changedLeader.length,
      westRawDirections: directions("west"),
      eastRawDirections: directions("east"),
      caveats: [
        "West is reconstructed by opposite-ascendant control; not an archived 1990 source-code replay.",
        "CORE_21 upstream KP subcalculator is not a complete historical west-model recreation.",
        "Raw numerical leads include noncertified methods and must not be called 31 votes or measured accuracy.",
        "The Tyson-Douglas fight start time is approximate; fixture longitude/latitude are Tokyo Dome coordinates.",
      ],
    };
    console.log("FIRMAMENT_TYSON_AB_BEGIN");
    console.log("FIRMAMENT_TYSON_AB_SUMMARY " + JSON.stringify(summary));
    for (const row of rows) console.log("FIRMAMENT_TYSON_AB_ROW " + JSON.stringify(row));
    console.log("FIRMAMENT_TYSON_AB_END");
    expect(changedAgentScores.length).toBeGreaterThan(0);
    expect(changedSynthesis.length).toBeGreaterThan(0);
  }, 60_000);
});
