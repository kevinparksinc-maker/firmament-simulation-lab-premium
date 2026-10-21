import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: async () => null }));
import {
  createSimulationDataset, createSimulationRun, getSimulationResultPage,
  getSimulationResultDetail, insertSimulationEvents, getSimulationRun,
} from "./simulationDb";
import { executeSingleMethodRun } from "./singleMethodBatchRunner";

const fixture = {
  teamA: "Dodgers", teamB: "Giants",
  favoredTeam: "Dodgers", underdogTeam: "Giants",
  roleAssignmentSource: "market-odds" as const,
  oddsSource: "Synthetic odds record for pipeline test (not real historical market evidence)",
  sport: "MLB" as const, location: "Los Angeles, CA",
  latitude: 34.0522, longitude: -118.2437,
  startTime: "2024-06-15T19:10:00.000Z",
  actualWinner: "A" as const,
};

describe("one-game saved batch pipeline and game-by-game inspection", () => {
  it("runs one method over one stored event and returns the full trace only when requested", async () => {
    const datasetId = await createSimulationDataset({
      name: "Synthetic one-game route smoke fixture", rowCount:1, validRowCount:1, invalidRowCount:0,
    });
    expect(datasetId).toBeTruthy();
    await insertSimulationEvents(datasetId!, [{...fixture, id:"one-real-row-not-duplicated"}]);
    const runId = await createSimulationRun(datasetId!,1);
    expect(runId).toBeTruthy();
    const summary = await executeSingleMethodRun(runId!, datasetId!, "CORE_01", 1);
    expect(summary.total).toBe(1);
    expect(summary.completedEvents).toBe(1);
    expect(summary.failedEvents).toBe(0);
    const savedRun = await getSimulationRun(runId!);
    expect(savedRun?.totalEvents).toBe(1);
    expect(savedRun?.status).toBe("complete");

    const page = await getSimulationResultPage(runId!,0,25);
    expect(page).toHaveLength(1);
    expect(page[0]?.fixture?.teamA).toBe("Dodgers");
    expect(page[0]?.fixture?.teamB).toBe("Giants");
    expect(page[0]?.methodId).toBe("CORE_01");
    expect(page[0]?.god?.scoreA).not.toBeNull();
    expect(page[0]?.agent?.scoreB).not.toBeNull();
    expect(page[0]?.combined?.result).toBeTruthy();

    const inspected = await getSimulationResultDetail(runId!,page[0]!.id);
    expect(inspected?.output).toMatchObject({
      methodId:"CORE_01",
      god:{frame:"God View"},
      agent:{frame:"Agent View"},
      certification:"NOT_CERTIFIED",
    });
    const nonexistent = await getSimulationResultDetail(runId!,page[0]!.id+1);
    expect(nonexistent).toBeNull();
  });

  it("does not fabricate extra games when a user requests 200 from a one-game dataset", async () => {
    const datasetId = await createSimulationDataset({name:"Too small for 200",rowCount:1,validRowCount:1,invalidRowCount:0});
    await insertSimulationEvents(datasetId!, [{...fixture,id:"only-one-source-game"}]);
    const runId = await createSimulationRun(datasetId!, 200);
    await expect(executeSingleMethodRun(runId!,datasetId!,"CORE_01",200)).rejects.toThrow(/1 valid games; 200 are required/);
    const rows = await getSimulationResultPage(runId!,0,25);
    expect(rows).toHaveLength(0);
  });
});
