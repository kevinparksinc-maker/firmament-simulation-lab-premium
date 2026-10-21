import { runSimulationEvent, type SimulationEventInput } from "./engine/simulationAdapter";
import { extractPattern, discoverPatterns, evaluatePatternHoldout } from "./engine/patternRecognition";
import { getSimulationEvents, insertSimulationResult, updateSimulationRun } from "./simulationDb";
import { createMethodPerformanceAccumulator } from "./engine/methodPerformance";

export async function executeSimulationRun(runId: number, datasetId: number) {
  const events = await getSimulationEvents(datasetId);
  let completedEvents = 0;
  let failedEvents = 0;
  const performance = createMethodPerformanceAccumulator();
  const patternRows: ReturnType<typeof extractPattern>[] = [];
  let verifiedCount = 0;
  let baselineHits = 0;

  for (const event of events) {
    try {
      const result = runSimulationEvent(event.input as SimulationEventInput);
      performance.observe(result);
      patternRows.push(extractPattern(result));
      if (result.comparison.verified) {
        verifiedCount++;
        if (result.baseline.verdict === "hit") baselineHits++;
      }
      await insertSimulationResult(runId, event.dbId, result);
      completedEvents += 1;
    } catch (error) {
      failedEvents += 1;
      await insertSimulationResult(runId, event.dbId, null, error instanceof Error ? error.message : "Unknown calculation error");
    }
    await updateSimulationRun(runId, { completedEvents, failedEvents });
    await new Promise<void>((resolve) => setImmediate(resolve));
  }


  const patternDiscovery = discoverPatterns(patternRows, { minSupport: 5, maxRules: 50 });
  const patternHoldout = evaluatePatternHoldout(patternRows, 0.2, 5);
  const summary = {
    patternRecognition: { discovery: patternDiscovery, holdout: patternHoldout },
    total: completedEvents + failedEvents,
    completedEvents,
    failedEvents,
    verified: verifiedCount,
    unverified: completedEvents - verifiedCount,
    baselineHits,
    baselineMisses: verifiedCount - baselineHits,
    baselineAccuracy: verifiedCount ? Number(((baselineHits / verifiedCount) * 100).toFixed(1)) : null,
    methodPerformance: performance.summary(),
  };
  await updateSimulationRun(runId, {
    status: failedEvents > 0 ? "partial" : "complete",
    completedEvents,
    failedEvents,
    summaryJson: JSON.stringify(summary),
    finishedAt: new Date(),
  });
  return summary;
}
