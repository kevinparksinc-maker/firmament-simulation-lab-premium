import { synthesizeFramePredictions } from "./crossFrameSynthesis";
import {
  generateFixedJ2000KPPrediction,
  generateFixedJ2000PlanetReadings,
  generatePredictionForModel,
  fixedEclipticHouseFromLongitude,
  kpDetailsFromCanonicalLongitude,
  runFullPackageDualFrameChallenger,
  buildCelestialGeometryEvidence,
  type AgentViewRotationMode,
  type GameInput,
  equalHouseZonePlacement,
  NAKSHATRAS,
  NAKSHATRA_ARC_DEGREES,
} from "./index";
import { calculateExperimentalLayers } from "./experimentalLayers";
import { houseCusp, locateInHouse } from "./houseFrameFoundation";
import { buildMethodChartSnapshot, runRegisteredMethodsFromSnapshot } from "./methodRegistry";
import { auditNeutralMethod, type NeutralMethodDiagnostic } from "./neutralMethodAudit";
import { buildExpandedMethodExperiment } from "./expandedMethodExperiment";
import { createMethodPerformanceAccumulator } from "./methodPerformance";
import { resolveEventContract } from "./eventPipelineContract";

export type SimulationEventInput = {
  id?: string;
  teamA: string;
  teamB: string;
  favoredTeam?: string;
  underdogTeam?: string;
  homeTeam?: string;
  awayTeam?: string;
  roleAssignmentSource?: "market-odds" | "expert-consensus" | "manual" | "legacy-side-order";
  oddsSource?: string;
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
  neutralDiagnostic: NeutralMethodDiagnostic;
  calculation?: { formula: string; inputs: string[]; steps: string[] };
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
  layer: { name: string; scoreA: number; scoreB: number; detail: string; source?: string; calculation?: { formula: string; inputs: string[]; steps: string[] } },
  actualWinner?: Winner,
): LayerResult {
  const winner = winnerFor(layer.scoreA, layer.scoreB);
  const result = {
    name: layer.name,
    scoreA: Number(layer.scoreA.toFixed(3)),
    scoreB: Number(layer.scoreB.toFixed(3)),
    winner,
    verdict: verdictFor(winner, actualWinner),
    detail: layer.detail,
    source: layer.source ?? "firmament-engine",
    calculation: layer.calculation ? {
      ...layer.calculation,
      steps: [...layer.calculation.steps, `Final method output: A ${layer.scoreA.toFixed(3)} vs B ${layer.scoreB.toFixed(3)} → ${winner === "A" ? "Side A" : winner === "B" ? "Side B" : "Tie"}.`, actualWinner ? `Hit/miss test: ${winner === actualWinner ? "HIT" : "MISS"} because method call ${winner} ${winner === actualWinner ? "matches" : "does not match"} verified result ${actualWinner}.` : "Hit/miss test: UNVERIFIED because no actual winner was supplied."],
    } : undefined,
  };
  return { ...result, neutralDiagnostic: auditNeutralMethod(result) };
}

function houseOverlays(planet: { manzil: { startLongitude: number; endLongitude: number }; nakshatra: string }, ascendantLongitude: number) {
  const nakshatraIndex = NAKSHATRAS.indexOf(planet.nakshatra as typeof NAKSHATRAS[number]);
  return {
    manzil: equalHouseZonePlacement(planet.manzil.startLongitude, planet.manzil.endLongitude, ascendantLongitude),
    nakshatra: nakshatraIndex >= 0 ? equalHouseZonePlacement(nakshatraIndex * NAKSHATRA_ARC_DEGREES, (nakshatraIndex + 1) * NAKSHATRA_ARC_DEGREES, ascendantLongitude) : null,
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
      backgroundWheelLongitude: Number(planet.backgroundWheelLongitude.toFixed(4)),
      house: planet.house,
      sign: planet.sign,
      degreeInHouse: Number(planet.degreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      manzil: planet.manzil,
      houseOverlays: houseOverlays(planet, prediction.ascendantLongitude),
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function fixedGodChartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>, startTime: Date) {
  const planets = generateFixedJ2000PlanetReadings(startTime);
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, "god", 0);
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
    domeModel: "fixed-zodiac-wheel",
    venue: "permanent fixed background",
    ascendantLongitude: 0,
    localSiderealTime: 0,
    houses,
    planets: planets.map((planet) => ({
      planet: planet.planet,
      tropicalLongitude: Number(planet.tropicalLongitude.toFixed(4)),
      backgroundWheelLongitude: Number(planet.backgroundWheelLongitude.toFixed(4)),
      house: planet.firmamentHouse,
      sign: planet.sign,
      degreeInHouse: Number(planet.firmamentDegreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      manzil: planet.manzil,
      houseOverlays: houseOverlays(planet, 0),
      isRetrograde: planet.isRetrograde,
    })),
  };
}

function dawnAgentChartSnapshot(prediction: ReturnType<typeof generateFixedJ2000KPPrediction>, ascendantLongitude: number, startTime: Date) {
  const planets = prediction.planets.map((planet) => {
    const local = locateInHouse(planet.backgroundWheelLongitude, "agent", ascendantLongitude);
    return { ...planet, house: local.house, degreeInHouse: local.degreeInHouse, sign: planet.sign };
  });
  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspLongitude = houseCusp(house, "agent", ascendantLongitude);
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
      backgroundWheelLongitude: Number(planet.backgroundWheelLongitude.toFixed(4)),
      house: planet.house,
      sign: planet.sign,
      degreeInHouse: Number(planet.degreeInHouse.toFixed(4)),
      nakshatra: planet.nakshatra,
      pada: planet.pada,
      starLord: planet.starLord,
      subLord: planet.subLord,
      manzil: planet.manzil,
      houseOverlays: houseOverlays(planet, ascendantLongitude),
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
  // Explain each score without disguising a full-chart evidence appendix as scoring.
  const methodWalkthrough = allLayers.map((layer, index) => {
    const calculation = layer.calculation;
    const scoringSteps = (calculation?.steps ?? []).filter(line => !line.startsWith("FAMILY EVIDENCE (not additional score):") && !line.startsWith("Collective coverage:"));
    const familyInputs = (calculation?.inputs ?? []).filter(line => line.startsWith("FAMILY EVIDENCE (not additional score):"));
    const scoringInputs = (calculation?.inputs ?? []).filter(line => !line.startsWith("FAMILY EVIDENCE (not additional score):"));
    const scoreA = layer.scoreA, scoreB = layer.scoreB;
    const familyDifference = Number((scoreA - scoreB).toFixed(3));
    // Preserve a complete, enumerated inventory of what this method could read.
    // This inventory is context, NOT evidence that the scoring formula used every body.
    const inventory = frame.fullChartLedger.bodies.map(body => ({
      planet: body.planet, zodiacLongitude: body.longitude, sign: body.sign,
      house: body.house, side: body.side, nakshatra: body.nakshatra,
      manzil: body.manzil, decan: body.decan,
      scoredDirectly: scoringSteps.some(step => step.includes(body.planet)),
    }));
    const houseInventory = frame.fullChartLedger.houses.map(house => ({
      house: house.house, side: house.side, occupants: house.occupants,
      mentionedInScoringSteps: scoringSteps.some(step => new RegExp(`\\bH${house.house}\\b`).test(step)),
    }));
    const sourceAspects = frame.fullChartLedger.aspects.map(aspect => ({
      ...aspect, mentionedInScoringSteps: scoringSteps.some(step =>
        step.includes(aspect.left) && step.includes(aspect.right)),
    }));
    const scoringInputsAreLedger = scoringInputs.length > 0;
    const limitations = [
      ...(!scoringInputsAreLedger ? ["No method-specific inputs were recorded."] : []),
      ...(scoringSteps.length === 0 ? ["No method-specific scoring steps were recorded."] : []),
      "The full-chart inventory is context only. A listed planet/house/aspect was not necessarily used in this method's points.",
      "No independent verification of the method's point coefficients or traditional doctrine is implied.",
    ];
    return {
      number: index + 1,
      method: layer.name,
      housesA: ascendantHouses,
      housesB: descendantHouses,
      appliedRule: calculation?.formula ?? "UNDOCUMENTED: method lacks a formal formula",
      scoringInputs,
      scoringSteps,
      familyEvidence: familyInputs,
      exactCalculation: {
        formula: calculation?.formula ?? null,
        scoringInputs,
        scoringSteps,
        completePlanetInventory: inventory,
        completeHouseInventory: houseInventory,
        aspectInventory: sourceAspects,
        limitations,
      },
      scoreA,
      scoreB,
      differenceAminusB: familyDifference,
      selectedSide: layer.winner,
      scoringProofStatus: !calculation?.formula || scoringSteps.length === 0 ? "INCOMPLETE_TRACE" : "FORMULA_AND_STEPS_RECORDED_NOT_INDEPENDENTLY_RECONCILED",
      arithmetic: `A ${scoreA.toFixed(3)} minus B ${scoreB.toFixed(3)} equals ${familyDifference.toFixed(3)}; method judgment ${layer.winner}`,
    };
  });
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
    fullChartLedger: frame.fullChartLedger,
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
      methodWalkthrough,
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
  const { gameInput, startTime, favoredTeam, underdogTeam, roleAssignmentSource, provenanceWarning } = resolveEventContract(input);

  const activePrediction = generateFixedJ2000KPPrediction(gameInput);
  const agentPrediction = generatePredictionForModel(gameInput, "azimuth");
  const dualFrame = runFullPackageDualFrameChallenger(gameInput, { agentViewRotation: input.agentViewRotation ?? "none", agentViewModel: input.agentViewModel ?? "astronomical" });
  const godExperimental = calculateExperimentalLayers(activePrediction, startTime);
  const agentExperimental = calculateExperimentalLayers(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, startTime);
  const godMethodSnapshot = buildMethodChartSnapshot(activePrediction, startTime, "god");
  const agentMethodSnapshot = buildMethodChartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, startTime, "agent", dualFrame.agent.ascendantLongitude);
  const godMethodResults = runRegisteredMethodsFromSnapshot(godMethodSnapshot);
  const agentMethodResults = runRegisteredMethodsFromSnapshot(agentMethodSnapshot);
  // Additional registered techniques are displayed explicitly beside the 21 core
  // layers. Their scores do not silently modify the 21-method synthesis.
  const additionalMethodIds = ["ASHTAKAVARGA_V1", "EVENT_LUNAR_DASHA_CHAIN_V1", "NATAL_VIMSHOTTARI_V1"] as const;
  const toAdditionalMethod = (result: (typeof godMethodResults)[number]) => ({
    id: result.methodId,
    name: result.methodId === "ASHTAKAVARGA_V1" ? "Ashtakavarga — BAV/SAV"
      : result.methodId === "EVENT_LUNAR_DASHA_CHAIN_V1" ? "Dasha — Event Lunar Nakshatra/Sub/Sub-Sub"
      : "Dasha — Natal Vimshottari (Maha/Antar/Pratyantar)",
    evaluable: result.evaluable,
    scoreA: result.scoreA,
    scoreB: result.scoreB,
    prediction: result.prediction,
    evidence: result.evidence,
    detail: result.detail,
    calculationVersion: result.calculationVersion,
    limitation: result.methodId === "NATAL_VIMSHOTTARI_V1" && !result.evaluable
      ? "NOT EVALUABLE: natal chart and birth time not supplied"
      : "Registry method; separate from the validated 21-method synthesis. Experimental sports scores.",
  });
  const additionalMethods = {
    godView: godMethodResults.filter(result => additionalMethodIds.some(id => id === result.methodId)).map(toAdditionalMethod),
    agentView: agentMethodResults.filter(result => additionalMethodIds.some(id => id === result.methodId)).map(toAdditionalMethod),
    synthesis: [] as Array<{id:string;name:string;scoreA:number|null;scoreB:number|null;prediction:"A"|"B"|"TIE"|"NONE";evaluable:boolean}>,
  };
  for(const id of additionalMethodIds){
    const god=additionalMethods.godView.find(row=>row.id===id)!;
    const agent=additionalMethods.agentView.find(row=>row.id===id)!;
    const evaluable=god.evaluable && agent.evaluable && god.scoreA!==null && god.scoreB!==null && agent.scoreA!==null && agent.scoreB!==null;
    const scoreA=evaluable?Number(((god.scoreA!+agent.scoreA!)/2).toFixed(3)):null;
    const scoreB=evaluable?Number(((god.scoreB!+agent.scoreB!)/2).toFixed(3)):null;
    additionalMethods.synthesis.push({id,name:god.name,scoreA,scoreB,evaluable,
      prediction:!evaluable?"NONE":scoreA===scoreB?"TIE":scoreA!>scoreB!?"A":"B"});
  }
  const celestialGeometry = buildCelestialGeometryEvidence(activePrediction.planets.map((planet) => ({ planet: planet.planet, longitude: planet.backgroundWheelLongitude, nakshatra: planet.nakshatra, manzil: planet.manzil })));
  const actualWinner = input.actualWinner;
  const baselineWinner = activePrediction.combined.winner as Winner;
  const baselineVerdict = verdictFor(baselineWinner, actualWinner);
  const predictiveSynthesis = synthesizeFramePredictions([...dualFrame.god.foundation.layers,...dualFrame.god.addedLayers], [...dualFrame.agent.foundation.layers,...dualFrame.agent.addedLayers], dualFrame.parity.valid);
  const expandedExperiment = buildExpandedMethodExperiment(
    predictiveSynthesis,
    godMethodResults,
    agentMethodResults,
    dualFrame.god.fullChartLedger.houses.length,
    dualFrame.god.fullChartLedger.bodies.length,
  );

  return {
    id: input.id ?? `${favoredTeam}-${underdogTeam}-${input.startTime}`,
    input: { ...input, teamA: favoredTeam, teamB: underdogTeam, favoredTeam, underdogTeam, roleAssignmentSource, startTime: startTime.toISOString() },
    evaluationFramework: {
      sideA: "Ascendant / favored to win",
      sideB: "Descendant / underdog",
      actualWinnerMeaning: "A means favored won; B means underdog won; TIE means no decisive result.",
      homeAwayIsMetadataOnly: true,
      roleAssignmentSource,
      provenanceWarning,
      primaryResearchEligible: roleAssignmentSource === "market-odds" && Boolean(input.oddsSource) && Boolean(input.actualWinner),
    },
    engine: {
      source: "firmament-engine",
      calculationPath: "generateFixedJ2000KPPrediction + celestialGeometry + runFullPackageDualFrameChallenger",
      fixedBackground: "fixed Aries-zero zodiac wheel",
      hamalAnchor: "13° Aries (configuration boundary; engine adapter does not silently alter formulas)",
    },
    chart: {
      godView: fixedGodChartSnapshot(activePrediction, startTime),
    agentView: input.agentViewModel === "fixed-earth-dawn-anchored"
        ? dawnAgentChartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>, dualFrame.agent.ascendantLongitude, startTime)
        : chartSnapshot(agentPrediction as ReturnType<typeof generateFixedJ2000KPPrediction>),
      celestialGeometry,
    },
    experimentalLayers: {
      status: "experimental-read-only" as const,
      note: "These four evidence layers are calculated for audit/backtest inspection only and do not modify the existing live baseline or 21-method frame synthesis.",
      godView: godExperimental,
      agentView: agentExperimental,
    },
    methodResults: {
      registryVersion: "METHOD_REGISTRY_V1",
      snapshotConvention: "reverse-numbered-360-equal-houses-v2",
      godView: godMethodResults,
      agentView: agentMethodResults,
    },
    additionalMethods,
    expandedExperiment,
    baseline: {
      territorial: activePrediction.territorial,
      kpStellar: activePrediction.kpStellar,
      combined: activePrediction.combined,
      winner: baselineWinner,
      verdict: baselineVerdict,
    },
    godView: frameReport(dualFrame.god, actualWinner),
    agentView: frameReport(dualFrame.agent, actualWinner),
    synthesisView: { ...predictiveSynthesis, verdict: verdictFor(predictiveSynthesis.winner, actualWinner) },
    frameParity: dualFrame.parity,
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
  const performance = createMethodPerformanceAccumulator();
  for (const result of results) performance.observe(result);
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
      methodPerformance: performance.summary(),
    },
  };
}
