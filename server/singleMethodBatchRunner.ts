import { runSingleMethodEvent } from "./engine/isolatedMethodRunner";
import { createSingleMethodAccumulator } from "./engine/singleMethodPerformance";
import { getSimulationEvents, insertSimulationResult, updateSimulationRun } from "./simulationDb";
import { selectIndependentGameCount, historicalFixtureIdentity, type IndependentGameCount } from "./engine/batchSelection";

/** Runs one requested method per game. No full 21/31 synthesis is invoked.
 * Per-game traces persist to the existing results table; summary keeps only
 * streaming aggregates, with no 10,000-result in-memory accumulation.
 */
export async function executeSingleMethodRun(runId: number, datasetId: number, methodId: string, gameCount: IndependentGameCount) {
  const events = selectIndependentGameCount(await getSimulationEvents(datasetId), gameCount, row => historicalFixtureIdentity(row.input));
  const collector = createSingleMethodAccumulator(methodId);
  let completedEvents = 0, failedEvents = 0;
  for (const event of events) {
    try {
      const result = runSingleMethodEvent(event.input, methodId);
      collector.observe(result);
      await insertSimulationResult(runId, event.dbId, result);
      completedEvents++;
    } catch (error) {
      failedEvents++;
      await insertSimulationResult(runId, event.dbId, null, error instanceof Error ? error.message : String(error));
    }
    await updateSimulationRun(runId, { completedEvents, failedEvents });
    await new Promise<void>(resolve => setImmediate(resolve));
  }
  const summary = {
    mode: "INDIVIDUAL_METHOD_ONLY",
    methodId, requestedGameCount: gameCount, selectionPolicy: `First ${gameCount} validated CSV events in original row order, no replacement or fabrication`, total: events.length, completedEvents, failedEvents,
    methodPerformance: collector.summary(),
    warning: "An individual method is not historically or doctrinally certified by generating 10,000 results. Validate fixture odds, actual kickoff and independent holdout first.",
  };
  await updateSimulationRun(runId, {
    status: failedEvents > 0 ? "partial" : "complete",
    completedEvents, failedEvents, summaryJson: JSON.stringify(summary), finishedAt: new Date(),
  });
  return summary;
}
