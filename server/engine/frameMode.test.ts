import { describe, expect, it } from "vitest";
import { generatePredictionForModel } from "./firmamentEngine";
import { runFullPackageDualFrameChallenger } from "./fullPackageDualFrameChallenger";
import { runSimulationEvent } from "./simulationAdapter";
import { calculateDawnAnchoredAscendant } from "./dawnAnchoredAscendant";

const event = {
  teamA: "New York Yankees",
  teamB: "Houston Astros",
  gameType: "MLB",
  location: "Houston, TX",
  // 7:10 PM CDT in Houston = 2024-04-02 00:10 UTC.
  startTime: new Date("2024-04-02T00:10:00.000Z"),
  coordinates: { latitude: 29.7604, longitude: -95.3698 },
} as const;

describe("dual-frame house systems", () => {
  it("keeps God View fixed and derives AgentView from event time and location", () => {
    const azimuthPrediction = generatePredictionForModel(event, "azimuth");
    const result = runFullPackageDualFrameChallenger(event);

    expect(result.god.coordinateFrame).toBe("fixed-j2000-ecliptic");
    expect(result.god.houseRule).toBe("permanent-aries-zero-whole-sign");
    expect(result.god.ascendantLongitude).toBe(0);

    expect(result.agent.coordinateFrame).toBe("observer-local-ascendant-whole-sign");
    expect(result.agent.houseRule).toBe("local-moving-ascendant-whole-sign");
    expect(result.agent.ascendantLongitude).toBeCloseTo(azimuthPrediction.ascendantLongitude, 2);
    expect(result.agent.ascendantLongitude).not.toBe(result.god.ascendantLongitude);
    expect(result.agent.foundationError).toBeUndefined();
    expect(result.agent.foundation.layers.length).toBeGreaterThan(0);
    expect(result.agent.foundation.layers).toHaveLength(result.god.foundation.layers.length);
  });

  it("supports explicit 180-degree AgentView experiments without changing God View", () => {
    const baseline = runFullPackageDualFrameChallenger(event);
    const ascendantOnly = runFullPackageDualFrameChallenger(event, { agentViewRotation: "ascendant-only" });
    const wholeChart = runFullPackageDualFrameChallenger(event, { agentViewRotation: "whole-chart" });
    const rotatedAscendant = (baseline.agent.ascendantLongitude + 180) % 360;

    expect(ascendantOnly.god.ascendantLongitude).toBe(baseline.god.ascendantLongitude);
    expect(wholeChart.god.synthesis).toEqual(baseline.god.synthesis);
    expect(ascendantOnly.agent.ascendantLongitude).toBeCloseTo(rotatedAscendant, 2);
    expect(wholeChart.agent.ascendantLongitude).toBeCloseTo(rotatedAscendant, 2);
    expect(ascendantOnly.agent.foundationError).toBeUndefined();
    expect(wholeChart.agent.foundationError).toBeUndefined();
    expect(ascendantOnly.agent.foundation).not.toEqual(baseline.agent.foundation);
    expect(wholeChart.agent.foundation).not.toEqual(ascendantOnly.agent.foundation);
  });

  it("passes 180-degree AgentView through the standard method evaluator", () => {
    const baseline = runSimulationEvent({ ...event, actualWinner: "B" });
    const rotated = runSimulationEvent({ ...event, actualWinner: "B", agentViewRotation: "ascendant-only" });

    expect(rotated.godView.allLayers).toHaveLength(20);
    expect(rotated.agentView.allLayers).toHaveLength(20);
    expect(rotated.agentView.ascendantLongitude).toBeCloseTo((baseline.agentView.ascendantLongitude + 180) % 360, 2);
    expect(rotated.godView.ascendantLongitude).toBe(baseline.godView.ascendantLongitude);
  });

  it("calculates the fixed-earth dawn ascendant at one degree per four minutes", () => {
    const result = calculateDawnAnchoredAscendant({
      birthOrEventTime: new Date("1986-11-20T16:06:00.000Z"),
      sunriseTime: new Date("1986-11-20T12:53:00.000Z"),
      sunEclipticLongitude: 238.044,
      sunriseSource: "Weather Channel",
    });

    expect(result.minutesElapsed).toBe(193);
    expect(result.rotationDegrees).toBe(48.25);
    expect(result.formattedAscendant).toBe("16°18′ Capricorn");
    expect(result.sunHouse).toBe(11);
    expect(result.sunriseSource).toBe("Weather Channel");
    expect(result.houses).toHaveLength(12);
  });

  it("keeps dawn-anchored AgentView distinct from astronomical AgentView", () => {
    const dawnEvent = {
      ...event,
      agentViewModel: "fixed-earth-dawn-anchored" as const,
      sunriseTime: "2024-04-01T12:10:13.153Z",
      sunriseSource: "Weather Channel",
    };
    const result = runSimulationEvent(dawnEvent);

    expect(result.godView.ascendantModel).toBe("god-fixed");
    expect(result.agentView.ascendantModel).toBe("fixed-earth-dawn-anchored");
    expect(result.agentView.coordinateFrame).toBe("fixed-earth-dawn-anchored");
    expect(result.agentView.sunriseSource).toBe("Weather Channel");
    expect(result.agentView.sunriseTime).toBe("2024-04-01T12:10:13.153Z");
    expect(result.agentView.allLayers).toHaveLength(20);
  });

  it("uses the event startTime—not a separate clock value—for dawn elapsed time", () => {
    const sunriseTime = new Date("2024-04-01T12:10:13.153Z");
    const first = runSimulationEvent({
      ...event,
      agentViewModel: "fixed-earth-dawn-anchored",
      sunriseTime: sunriseTime.toISOString(),
      sunriseSource: "astronomy-engine sunrise test",
    });
    const oneHourLater = runSimulationEvent({
      ...event,
      startTime: new Date(event.startTime.getTime() + 60 * 60 * 1000),
      agentViewModel: "fixed-earth-dawn-anchored",
      sunriseTime: sunriseTime.toISOString(),
      sunriseSource: "astronomy-engine sunrise test",
    });

    expect(first.agentView.ascendantLongitude).not.toBe(oneHourLater.agentView.ascendantLongitude);
    expect(oneHourLater.agentView.ascendantLongitude).toBeGreaterThan(first.agentView.ascendantLongitude);
  });
});
