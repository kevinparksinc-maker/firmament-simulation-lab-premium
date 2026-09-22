import {
  generateFixedJ2000KPPrediction,
  generateFixedJ2000PlanetReadings,
  generatePredictionForModel,
  fixedEclipticHouseFromLongitude,
  kpDetailsFromCanonicalLongitude,
  runFullPackageDualFrameChallenger,
  type AgentViewRotationMode,
  type GameInput,
} from "./index";

export type SimulationEventInput = {
  id?: string;
  teamA: string;
  teamB: string;
  sport: GameInput["gameType"];
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  actualWinner?: "A" | "B" | "TIE";
  agentViewRotation?: AgentViewRotationMode;
  agentViewModel?: "astronomical" | "fixed-earth-dawn-anchored";
  sunriseTime?: string;
  sunriseSource?: string;
};

type Winner = "A" | "B" | "TIE";

type LayerResult = {
  name: string;
  scoreA: number;
  scoreB: number;
  winner: Winner;
  verdict: "hit" | "miss" | "tie" | "unverified";
  detail: string;
  source: string;
};

function winnerFor(scoreA: number, scoreB: number): Winner {
  if (scoreA === scoreB) return "TIE";
  return scoreA > scoreB ? "A" : "B";
}

function verdictFor(winner: Winner, actualWinner?: Winner): LayerResult["verdict"] {
  if (!actualWinner) return "unverified";
  if (winner === "TIE" || actualWinner === "TIE") return winner === actualWinner ? "tie" : "miss";
  return winner === actualWinner ? "hit" : "miss";
}

function layerFromEvidence(
  layer: { name: string; scoreA: number; scoreB: number; detail: string; source?: string },
  actualWinner?: Winner,
): LayerResult {
  const winner = winnerFor(layer.scoreA, layer.scoreB);
  return {
    name: layer.name,
    scoreA: Number(layer.scoreA.toFixed(3)),
    scoreB: Number(layer.scoreB.toFixed(3)),
    winner,
    verdict: verdictFor(winner, actualWinner),
    detail: layer.detail,
    source: layer.source ?? "firmament-engine",
  };
}

function chartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>) {
  return {
    domeModel: prediction.domeModel,
    venue: prediction.venue,
    ascendantLongitude: prediction.ascendantLongitude,
    localSiderealTime: prediction.localSiderealTime,
    houses: prediction.houses.map((house) => ({
      house: house.house,
      cluster: house.cluster,
      cuspLongitude: Number(house.cuspLongitude.toFixed(4)),
      sign: house.sign,
      starLord: house.starLord,
      subLord: house.subLord,
      subLordHouse: house.subLordHouse,
      subLordAllegiance: house.subLordAllegiance,
    })),
    planets: prediction.planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      fixedBackgroundLongitude: Number(planet.fixedJ2000EclipticLongitude.toFixed(4)),
      house: planet.house,
      sign: planet.sign,
      degreeInHouse: Number(planet.degreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function fixedGodChartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>, startTime: Date) {
  const planets = generateFixedJ2000PlanetReadings(startTime);
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = index * 30;
    const stellar = kpDetailsFromCanonicalLongitude(cuspLongitude, startTime, false);
    const subLordPlacement = planets.find((planet) => planet.planet === stellar.subLord);
    return {
      house,
      cluster: prediction.houses[index]?.cluster ?? "neutral",
      cuspLongitude,
      sign: signs[index],
      starLord: stellar.starLord,
      subLord: stellar.subLord,
      subLordHouse: subLordPlacement?.house ?? null,
      subLordAllegiance: prediction.houses[index]?.subLordAllegiance ?? "neutral",
    };
  });
  return {
    domeModel: "fixed-j2000-kp",
    venue: "permanent fixed background",
    ascendantLongitude: 0,
    localSiderealTime: 0,
    houses,
    planets: planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      fixedBackgroundLongitude: Number(planet.fixedJ2000EclipticLongitude.toFixed(4)),
      house: planet.firmamentHouse,
      sign: planet.sign,
      degreeInHouse: Number(planet.firmamentDegreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function dawnAgentChartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>, ascendantLongitude: number, startTime: Date) {
  const ascendantSignStart = Math.floor(ascendantLongitude / 30) * 30;
  const planets = prediction.planets.map((planet) => {
    const local = fixedEclipticHouseFromLongitude(planet.ofDateEclipticLongitude - ascendantSignStart);
    return { ...planet, house: local.house, degreeInHouse: local.degreeInHouse, sign: planet.sign };
  });
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = (ascendantSignStart + index * 30) % 360;
    const stellar = kpDetailsFromCanonicalLongitude(cuspLongitude, startTime, true);
    const subLordPlacement = planets.find((planet) => planet.planet === stellar.subLord);
    return {
      house,
      cluster: prediction.houses[index]?.cluster ?? "neutral",
      cuspLongitude,
      sign: fixedEclipticHouseFromLongitude(cuspLongitude).sign,
      starLord: stellar.starLord,
      subLord: stellar.subLord,
      subLordHouse: subLordPlacement?.house ?? null,
      subLordAllegiance: prediction.houses[index]?.subLordAllegiance ?? "neutral",
    };
  });
  return {
    domeModel: "fixed-earth-dawn-anchored",
    venue: prediction.venue,
    ascendantLongitude,
    localSiderealTime: prediction.localSiderealTime,
    houses,
    planets: planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      fixedBackgroundLongitude: Number(planet.fixedJ2000EclipticLongitude.toFixed(4)),
      house: planet.house,
      sign: planet.sign,
      degreeInHouse: Number(planet.degreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function frameReport(
  frame: ReturnType<typeof runFullPackageDualFrameChallenger>["god"],
  actualWinner?: Winner,
) {
  const foundation = frame.foundation.layers.map((layer) => layerFromEvidence(layer, actualWinner));
  const added = frame.addedLayers.map((layer) => layerFromEvidence(layer, actualWinner));
  const allLayers = [...foundation, ...added];
  const ascendantHouses = [1, 2, 3, 6, 10, 11];
  const descendantHouses = [4, 5, 7, 8, 9, 12];
  const decisionTrace = [
    `Role assignment: Side A = Ascendant territory in H${ascendantHouses.join(", H")}; Side B = Descendant territory in H${descendantHouses.join(", H")}.`,
    `Frame rule: ${frame.houseRule}; coordinate frame: ${frame.coordinateFrame}; ascendant model: ${frame.ascendantModel}.`,
    ...allLayers.map((layer) => `${layer.name}: raw score A ${layer.scoreA.toFixed(3)} vs B ${layer.scoreB.toFixed(3)} → ${layer.winner === "A" ? "Side A / Ascendant" : layer.winner === "B" ? "Side B / Descendant" : "Tie"}. Recorded evidence: ${layer.detail}`),
    `Synthesis: foundation A ${frame.foundation.scoreA.toFixed(3)} + extensions = A ${frame.synthesis.scoreA.toFixed(3)}; foundation B ${frame.foundation.scoreB.toFixed(3)} + extensions = B ${frame.synthesis.scoreB.toFixed(3)}; margin ${frame.synthesis.margin.toFixed(3)} → ${frame.synthesis.winner === "A" ? "Side A / Ascendant" : frame.synthesis.winner === "B" ? "Side B / Descendant" : "Tie"}.`,
  ];
  return {
    name: frame.name,
    coordinateFrame: frame.coordinateFrame,
    houseRule: frame.houseRule,
    ascendantModel: frame.ascendantModel,
    sunriseSource: frame.sunriseSource ?? null,
    sunriseTime: frame.sunriseTime ?? null,
    ascendantLongitude: frame.ascendantLongitude,
    synthesis: {
      ...frame.synthesis,
      verdict: verdictFor(frame.synthesis.winner, actualWinner),
    },
    foundation,
    added,
    allLayers,
    proof: {
      roleAssignment: {
        sideA: "Ascendant",
        sideB: "Descendant",
        ascendantHouses,
        descendantHouses,
      },
      scoreFormula: frame.synthesis.formula,
      decisionTrace,
    },
    summary: {
      hits: allLayers.filter((layer) => layer.verdict === "hit").length,
      misses: allLayers.filter((layer) => layer.verdict === "miss").length,
      ties: allLayers.filter((layer) => layer.verdict === "tie").length,
      unverified: allLayers.filter((layer) => layer.verdict === "unverified").length,
    },
  };
}

export function runSimulationEvent(input: SimulationEventInput) {
  const startTime = new Date(input.startTime);
  if (Number.isNaN(startTime.getTime())) throw new Error("startTime must be a valid ISO date");
  const gameInput: GameInput = {
    teamA: input.teamA,
    teamB: input.teamB,
    gameType: input.sport,
    location: input.location,
    startTime,
    ...(input.sunriseTime ? { sunriseTime: new Date(input.sunriseTime) } : {}),
    ...(input.sunriseSource ? { sunriseSource: input.sunriseSource } : {}),
    ...(input.agentViewModel ? { agentViewModel: input.agentViewModel } : {}),
    ...(input.latitude !== undefined && input.longitude !== undefined
      ? { coordinates: { latitude: input.latitude, longitude: input.longitude } }
      : {}),
  };

  const activePrediction = generateFixedJ2000KPPrediction(gameInput);
  const agentPrediction = generatePredictionForModel(gameInput, "azimuth");
  const dualFrame = runFullPackageDualFrameChallenger(gameInput, { agentViewRotation: input.agentViewRotation ?? "none", agentViewModel: input.agentViewModel ?? "astronomical" });
  const actualWinner = input.actualWinner;
  const baselineWinner = activePrediction.combined.winner as Winner;
  const baselineVerdict = verdictFor(baselineWinner, actualWinner);

  return {
    id: input.id ?? `${input.teamA}-${input.teamB}-${input.startTime}`,
    input: { ...input, startTime: startTime.toISOString() },
    engine: {
      source: "firmament-engine",
      calculationPath: "generateFixedJ2000KPPrediction + runFullPackageDualFrameChallenger",
      fixedBackground: "fixed-j2000-ecliptic compatibility frame",
      hamalAnchor: "13° Aries (configuration boundary; engine adapter does not silently alter formulas)",
    },
    chart: {
      godView: fixedGodChartSnapshot(activePrediction, startTime),
      agentView: input.agentViewModel === "fixed-earth-dawn-anchored"
        ? dawnAgentChartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, dualFrame.agent.ascendantLongitude, startTime)
        : chartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>),
    },
    baseline: {
      territorial: activePrediction.territorial,
      kpStellar: activePrediction.kpStellar,
      combined: activePrediction.combined,
      winner: baselineWinner,
      verdict: baselineVerdict,
    },
    godView: frameReport(dualFrame.god, actualWinner),
    agentView: frameReport(dualFrame.agent, actualWinner),
    comparison: {
      state: dualFrame.agreement.state,
      winner: dualFrame.agreement.winner,
      actualWinner: actualWinner ?? null,
      verified: Boolean(actualWinner),
    },
  };
}

export function runSimulationBatch(events: SimulationEventInput[]) {
  const results = events.map((event) => runSimulationEvent(event));
  const verified = results.filter((result) => result.comparison.verified);
  const hits = verified.filter((result) => result.baseline.verdict === "hit").length;
  return {
    results,
    summary: {
      total: results.length,
      verified: verified.length,
      unverified: results.length - verified.length,
      baselineHits: hits,
      baselineMisses: verified.length - hits,
      baselineAccuracy: verified.length ? Number(((hits / verified.length) * 100).toFixed(1)) : null,
    },
  };
}
