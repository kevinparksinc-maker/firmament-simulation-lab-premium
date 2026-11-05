import type { SimulationEventInput } from "./engine/simulationAdapter";
import { runSimulationEvent } from "./engine/simulationAdapter";
import { invokeLLM } from "./_core/llm";

/**
 * Sports interpretation is downstream of the deterministic Simulation Lab.
 * The language model must not calculate or overwrite scores.
 */
export const MASTER_SPORTS_ASTROLOGER_SYSTEM = [
  "You are the Master Sports Astrologer for Firmament Simulation Lab Premium.",
  "Interpret the supplied event chart as a contest, NEVER as a natal personality reading.",
  "Side A is Ascendant (houses 1,2,3,6,10,11); side B is Descendant (houses 4,5,7,8,9,12).",
  "Read the existing God View, Agent View, synthesis, individual methods, evidence, and limitations.",
  "Distinguish the 21-method core synthesis from additional registered methods and evidence-only or experimental layers. Do not add excluded scores to the official total.",
  "Explain the strongest supporting and opposing indications, house and planetary strength, lunar factors, timing, and disagreements between methods only where documented.",
  "Structure the reading as WHAT (contest judgment), WHY (strongest methods), HOW (house/planet mechanisms), CONTRADICTIONS, CONSEQUENCE, and FINAL JUDGMENT.",
  "Quote exact numeric A/B scores and method names from the record. Never invent placements, weights, probabilities, method counts, or missing data.",
  "If synthesis is invalid, withhold a definitive winner. If a tie is recorded, explain the numeric margin and tie threshold.",
  "Never use actualWinner, hit/miss verdicts, or historical outcome as evidence for a pregame prediction.",
  "Astrological outcomes are experimental and not guaranteed; do not offer betting instructions.",
].join("\n");

export function sportsPregameEvidence(input: SimulationEventInput) {
  const simulation = runSimulationEvent({ ...input, actualWinner: undefined });
  const { actualWinner: _actualWinner, ...safeInput } = simulation.input;
  return {
    input: safeInput,
    evaluationFramework: simulation.evaluationFramework,
    engine: simulation.engine,
    chart: simulation.chart,
    godView: { allLayers: simulation.godView.allLayers.map(({ verdict: _verdict, ...rest }) => rest), synthesis: simulation.godView.synthesis },
    agentView: { allLayers: simulation.agentView.allLayers.map(({ verdict: _verdict, ...rest }) => rest), synthesis: simulation.agentView.synthesis },
    synthesisView: { ...simulation.synthesisView, verdict: undefined },
    frameParity: simulation.frameParity,
    methodResults: simulation.methodResults,
    additionalMethods: simulation.additionalMethods,
    experimentalLayers: simulation.experimentalLayers,
  };
}

export async function interpretSportsEvent(input: SimulationEventInput) {
  const evidence = sportsPregameEvidence(input);
  const response = await invokeLLM({
    messages: [
      { role: "system", content: MASTER_SPORTS_ASTROLOGER_SYSTEM },
      { role: "user", content: "Interpret this computed contest evidence without changing its scores:\n" + JSON.stringify(evidence) },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return { evidence, interpretation: typeof content === "string" ? content : "AI returned no interpretation." };
}
