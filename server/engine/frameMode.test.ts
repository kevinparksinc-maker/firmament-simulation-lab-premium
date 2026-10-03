import { describe, expect, it } from "vitest";
import { equalHouseZonePlacement, fixedEclipticHouseFromLongitude, generatePredictionForModel, manzilFromLongitude, NAKSHATRA_ARC_DEGREES } from "./firmamentEngine";
import { buildCelestialGeometryEvidence } from "./celestialGeometry";
import { runFullPackageDualFrameChallenger } from "./fullPackageDualFrameChallenger";
import { runSimulationEvent } from "./simulationAdapter";
import { calculateDawnAnchoredAscendant } from "./dawnAnchoredAscendant";
import { buildPersonalChart } from "./personalChart";

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

    expect(result.god.coordinateFrame).toBe("fixed-zodiac-wheel");
    expect(result.god.houseRule).toBe("permanent-aries-zero-equal-house");
    expect(result.god.ascendantLongitude).toBe(0);

    expect(result.agent.coordinateFrame).toBe("observer-local-ascendant-equal-house");
    expect(result.agent.houseRule).toBe("local-moving-ascendant-equal-house");
    expect(result.agent.ascendantLongitude).toBeCloseTo(azimuthPrediction.ascendantLongitude, 2);
    expect(result.agent.ascendantLongitude).not.toBe(result.god.ascendantLongitude);
    expect(result.agent.foundationError).toBeUndefined();
    expect(result.agent.foundation.layers.length).toBeGreaterThan(0);
    expect(result.agent.foundation.layers).toHaveLength(result.god.foundation.layers.length);
  });

  it("keeps the 360-degree background overlays identical while houses use different perspectives", () => {
    const god = generatePredictionForModel(event, "fixed-zodiac-wheel");
    const agent = generatePredictionForModel(event, "azimuth");
    const godMars = god.planets.find((planet) => planet.planet === "Mars")!;
    const agentMars = agent.planets.find((planet) => planet.planet === "Mars")!;

    expect(agentMars.backgroundWheelLongitude).toBeCloseTo(godMars.backgroundWheelLongitude, 8);
    expect(agentMars.nakshatra).toBe(godMars.nakshatra);
    expect(agentMars.pada).toBe(godMars.pada);
    expect(agentMars.starLord).toBe(godMars.starLord);
    expect(agentMars.subLord).toBe(godMars.subLord);
    expect(agentMars.degreeInSign).toBeCloseTo(godMars.degreeInSign, 8);
  });

  it("maps a 100-degree planet to fixed H4 and exact-degree equal houses", () => {
    expect(fixedEclipticHouseFromLongitude(100)).toMatchObject({ house: 4, sign: "Cancer", degreeInHouse: 10 });
    expect(fixedEclipticHouseFromLongitude(100 - 95).house).toBe(1);
    expect(fixedEclipticHouseFromLongitude(100 - 119).house).toBe(12);
  });

  it("keeps the 28 Arabic Manzil divisions fixed on the same wheel", () => {
    expect(manzilFromLongitude(0)).toMatchObject({ index: 1, name: "Al-Sharatain", startLongitude: 0 });
    expect(manzilFromLongitude(360 / 28)).toMatchObject({ index: 2, name: "Al-Butain" });
    expect(manzilFromLongitude(100)).toMatchObject({ index: 8, name: "Al-Nathra" });

    const god = generatePredictionForModel(event, "fixed-zodiac-wheel");
    const agent = generatePredictionForModel(event, "azimuth");
    for (const planet of god.planets) {
      const matching = agent.planets.find((candidate) => candidate.planet === planet.planet)!;
      expect(matching.manzil).toEqual(planet.manzil);
    }
  });

  it("builds weighted planet, Manzil-center, Nakshatra-center, and convergence evidence", () => {
    const prediction = generatePredictionForModel(event, "fixed-zodiac-wheel");
    const evidence = buildCelestialGeometryEvidence(prediction.planets.map((planet) => ({ planet: planet.planet, longitude: planet.backgroundWheelLongitude, nakshatra: planet.nakshatra, manzil: planet.manzil })));
    expect(evidence.orb).toBe(5);
    expect(evidence.aspectAngles).toContain(120);
    expect(evidence.occupancy).toHaveLength(prediction.planets.length);
    expect(evidence.planetManzilAspects.every((relationship) => relationship.orb <= 5)).toBe(true);
    expect(evidence.planetNakshatraAspects.every((relationship) => relationship.orb <= 5)).toBe(true);
    expect(evidence.planetManzilAspects.every((relationship) => relationship.weight >= 1 && relationship.weight <= 5)).toBe(true);
  });

  it("builds a natal chart, local transit chart, and transit-to-natal geometry", () => {
    const result = buildPersonalChart({
      birthDateTime: "1990-02-11T00:00:00.000Z",
      birthLocation: "Tokyo, Japan",
      birthLatitude: 35.6762,
      birthLongitude: 139.6503,
      transitDateTime: "2026-09-23T16:00:00.000Z",
      transitLocation: "New York, NY",
      transitLatitude: 40.7128,
      transitLongitude: -74.006,
    });
    expect(result.natal.godView.planets).toHaveLength(9);
    expect(result.transit.agentView.houses).toHaveLength(12);
    expect(result.geometry.orb).toBe(5);
    expect(result.geometry.planetaryAspects.every((relationship) => relationship.source.startsWith("Transit ") && relationship.target.startsWith("Natal "))).toBe(true);
  });

  it("moves both fixed lunar-zone overlays when the AgentView ascendant shifts", () => {
    const manzilZone = equalHouseZonePlacement(90, 90 + 360 / 28, 65);
    const shiftedManzilZone = equalHouseZonePlacement(90, 90 + 360 / 28, 95);
    const nakshatraZone = equalHouseZonePlacement(0, NAKSHATRA_ARC_DEGREES, 65);
    const shiftedNakshatraZone = equalHouseZonePlacement(0, NAKSHATRA_ARC_DEGREES, 95);
    expect(shiftedManzilZone.centerHouse).not.toBe(manzilZone.centerHouse);
    expect(shiftedNakshatraZone.centerHouse).not.toBe(nakshatraZone.centerHouse);
    expect(manzilZone.segments.reduce((total, segment) => total + segment.degrees, 0)).toBeCloseTo(360 / 28, 5);
    expect(nakshatraZone.segments.reduce((total, segment) => total + segment.degrees, 0)).toBeCloseTo(NAKSHATRA_ARC_DEGREES, 5);
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

    expect(rotated.godView.allLayers).toHaveLength(21);
    expect(rotated.agentView.allLayers).toHaveLength(21);
    expect(rotated.agentView.ascendantLongitude).toBeCloseTo((baseline.agentView.ascendantLongitude + 180) % 360, 2);
    expect(rotated.godView.ascendantLongitude).toBe(baseline.godView.ascendantLongitude);
  });

  it("proves a God/Agent split preserves identical methods and formulas", () => {
    const result = runSimulationEvent({ ...event, actualWinner: undefined });
    expect(result.frameParity.valid).toBe(true);
    expect(result.frameParity.methodParity).toBe(true);
    expect(result.frameParity.formulaParity).toBe(true);
    expect(result.frameParity.sourceParity).toBe(true);
    expect(result.frameParity.ruleClassParity).toBe(true);
    expect(result.frameParity.synthesisParity).toBe(true);
    expect(result.frameParity.reason).toContain("same method roster");
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
    expect(result.agentView.allLayers).toHaveLength(21);
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
