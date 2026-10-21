import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  simulationDatasets,
  simulationEvents,
  simulationResults,
  simulationRuns,
  type SimulationDataset,
  type SimulationEvent,
  type SimulationRun,
  type SimulationResult,
} from "../drizzle/schema";
import type { SimulationEventInput } from "./engine/simulationAdapter";

// In-memory fallback stores when MySQL is offline
const inMemoryDatasets = new Map<number, SimulationDataset>();
const inMemoryEvents = new Map<number, SimulationEvent[]>();
const inMemoryRuns = new Map<number, SimulationRun>();
const inMemoryResults = new Map<number, SimulationResult[]>();
let nextDatasetId = 1;
let nextEventId = 1;
let nextRunId = 1;
let nextResultId = 1;

export async function createSimulationDataset(input: {
  name: string;
  sourceFileName?: string;
  sourceDescription?: string;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
}) {
  const db = await getDb();
  const status = input.validRowCount === 0 ? "rejected" : input.invalidRowCount > 0 ? "partial" : "validated";
  if (!db) {
    const id = nextDatasetId++;
    const dataset: SimulationDataset = {
      id,
      name: input.name,
      sourceFileName: input.sourceFileName ?? null,
      sourceDescription: input.sourceDescription ?? null,
      schemaVersion: "events-v1",
      rowCount: input.rowCount,
      validRowCount: input.validRowCount,
      invalidRowCount: input.invalidRowCount,
      status,
      createdAt: new Date(),
    };
    inMemoryDatasets.set(id, dataset);
    return id;
  }
  const inserted = await db.insert(simulationDatasets).values({ ...input, status }).$returningId();
  return inserted[0]?.id ?? null;
}

export async function insertSimulationEvents(datasetId: number, events: SimulationEventInput[]) {
  const db = await getDb();
  if (!db) {
    const list = inMemoryEvents.get(datasetId) ?? [];
    events.forEach((event, index) => {
      list.push({
        id: nextEventId++,
        datasetId,
        rowNumber: index + 2,
        eventId: event.id ?? `row-${index + 2}`,
        teamA: event.teamA,
        teamB: event.teamB,
        favoredTeam: event.favoredTeam ?? null,
        underdogTeam: event.underdogTeam ?? null,
        roleAssignmentSource: event.roleAssignmentSource ?? "legacy-side-order",
        oddsSource: event.oddsSource ?? null,
        sport: event.sport,
        location: event.location,
        latitude: event.latitude?.toString() ?? null,
        longitude: event.longitude?.toString() ?? null,
        startTime: new Date(event.startTime),
        actualWinner: event.actualWinner ?? null,
        validationStatus: "valid",
        validationError: null,
      });
    });
    inMemoryEvents.set(datasetId, list);
    return;
  }
  if (events.length === 0) return;
  await db.insert(simulationEvents).values(events.map((event, index) => ({
    datasetId,
    rowNumber: index + 2,
    eventId: event.id ?? `row-${index + 2}`,
    teamA: event.teamA,
    teamB: event.teamB,
    favoredTeam: event.favoredTeam,
    underdogTeam: event.underdogTeam,
    roleAssignmentSource: event.roleAssignmentSource,
    oddsSource: event.oddsSource,
    sport: event.sport,
    location: event.location,
    latitude: event.latitude?.toString(),
    longitude: event.longitude?.toString(),
    startTime: new Date(event.startTime),
    actualWinner: event.actualWinner,
    validationStatus: "valid" as const,
  })));
}

export async function getSimulationEvents(datasetId: number) {
  const db = await getDb();
  if (!db) {
    const list = inMemoryEvents.get(datasetId) ?? [];
    return list.map((row) => ({
      dbId: row.id,
      input: {
        id: row.eventId,
        teamA: row.teamA,
        teamB: row.teamB,
        favoredTeam: row.favoredTeam ?? undefined,
        underdogTeam: row.underdogTeam ?? undefined,
        roleAssignmentSource: (row.roleAssignmentSource ?? "legacy-side-order") as SimulationEventInput["roleAssignmentSource"],
        oddsSource: row.oddsSource ?? undefined,
        sport: row.sport as SimulationEventInput["sport"],
        location: row.location,
        latitude: row.latitude === null ? undefined : Number(row.latitude),
        longitude: row.longitude === null ? undefined : Number(row.longitude),
        startTime: row.startTime.toISOString(),
        actualWinner: row.actualWinner as SimulationEventInput["actualWinner"],
      },
    }));
  }
  const rows = await db.select().from(simulationEvents).where(eq(simulationEvents.datasetId, datasetId)).orderBy(simulationEvents.rowNumber);
  return rows.map((row) => ({
    dbId: row.id,
    input: {
      id: row.eventId,
      teamA: row.teamA,
      teamB: row.teamB,
      favoredTeam: row.favoredTeam ?? undefined,
      underdogTeam: row.underdogTeam ?? undefined,
      roleAssignmentSource: (row.roleAssignmentSource ?? "legacy-side-order") as SimulationEventInput["roleAssignmentSource"],
      oddsSource: row.oddsSource ?? undefined,
      sport: row.sport as SimulationEventInput["sport"],
      location: row.location,
      latitude: row.latitude === null ? undefined : Number(row.latitude),
      longitude: row.longitude === null ? undefined : Number(row.longitude),
      startTime: row.startTime.toISOString(),
      actualWinner: row.actualWinner as SimulationEventInput["actualWinner"],
    },
  }));
}

export async function createSimulationRun(datasetId: number, totalEvents: number) {
  const db = await getDb();
  if (!db) {
    const id = nextRunId++;
    const run: SimulationRun = {
      id,
      datasetId,
      status: "running",
      totalEvents,
      completedEvents: 0,
      failedEvents: 0,
      summaryJson: null,
      startedAt: new Date(),
      finishedAt: null,
      createdAt: new Date(),
    };
    inMemoryRuns.set(id, run);
    return id;
  }
  const inserted = await db.insert(simulationRuns).values({ datasetId, totalEvents, status: "running", startedAt: new Date() }).$returningId();
  return inserted[0]?.id ?? null;
}

export async function updateSimulationRun(runId: number, values: Partial<typeof simulationRuns.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryRuns.get(runId);
    if (existing) {
      inMemoryRuns.set(runId, {
        ...existing,
        ...values,
      } as SimulationRun);
    }
    return;
  }
  await db.update(simulationRuns).set(values).where(eq(simulationRuns.id, runId));
}

export async function getSimulationRun(runId: number) {
  const db = await getDb();
  if (!db) {
    return inMemoryRuns.get(runId) ?? null;
  }
  const rows = await db.select().from(simulationRuns).where(eq(simulationRuns.id, runId)).limit(1);
  return rows[0] ?? null;
}

export async function listSimulationRuns(limit = 12) {
  const db = await getDb();
  if (!db) {
    const list = Array.from(inMemoryRuns.values());
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list.slice(0, limit);
  }
  return db.select().from(simulationRuns).orderBy(desc(simulationRuns.createdAt)).limit(limit);
}

export async function insertSimulationResult(runId: number, eventId: number, output: unknown, errorMessage?: string) {
  const db = await getDb();
  if (!db) {
    const list = inMemoryResults.get(runId) ?? [];
    list.push({
      id: nextResultId++,
      runId,
      eventId,
      status: errorMessage ? "failed" : "complete",
      outputJson: errorMessage ? null : JSON.stringify(output),
      errorMessage: errorMessage ?? null,
      createdAt: new Date(),
    });
    inMemoryResults.set(runId, list);
    return;
  }
  await db.insert(simulationResults).values({
    runId,
    eventId,
    status: errorMessage ? "failed" : "complete",
    outputJson: errorMessage ? null : JSON.stringify(output),
    errorMessage,
  });
}

export async function listSimulationDatasets() {
  const db = await getDb();
  if (!db) {
    const list = Array.from(inMemoryDatasets.values());
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return list;
  }
  return db.select().from(simulationDatasets).orderBy(simulationDatasets.createdAt);
}

/**
 * Paginate persisted per-event proofs so a 10,000-game experiment doesn't
 * materialize 10,000 full chart ledgers in one browser response.
 */
export async function getSimulationResultPage(runId: number, offset: number, pageSize = 25) {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError("Invalid run result page.");
  }
  const db = await getDb();
  const rows = db
    ? await db.select().from(simulationResults).where(eq(simulationResults.runId, runId)).orderBy(simulationResults.id).limit(pageSize).offset(offset)
    : (inMemoryResults.get(runId) ?? []).slice(offset, offset + pageSize);
  return rows.map(row => {
    let parsed: {
      methodId?: string;
      event?: { teamA?: string; teamB?: string; startTime?: string };
      actualWinner?: string | null;
      god?: { scoreA?: number | null; scoreB?: number | null; result?: string };
      agent?: { scoreA?: number | null; scoreB?: number | null; result?: string };
      combined?: { scoreA?: number | null; scoreB?: number | null; result?: string };
      comparison?: string;
      frameMethodStatus?: string;
    } | null = null;
    try { parsed = row.outputJson ? JSON.parse(row.outputJson) : null; }
    catch { parsed = null; }
    return {
      id: row.id,
      eventId: row.eventId,
      status: row.status,
      errorMessage: row.errorMessage,
      fixture: parsed?.event ? {
        teamA: parsed.event.teamA ?? "Unknown",
        teamB: parsed.event.teamB ?? "Unknown",
        startTime: parsed.event.startTime ?? "",
      } : null,
      methodId: parsed?.methodId ?? null,
      god: parsed?.god ? { scoreA: parsed.god.scoreA ?? null, scoreB: parsed.god.scoreB ?? null, result: parsed.god.result ?? null } : null,
      agent: parsed?.agent ? { scoreA: parsed.agent.scoreA ?? null, scoreB: parsed.agent.scoreB ?? null, result: parsed.agent.result ?? null } : null,
      combined: parsed?.combined ? { scoreA: parsed.combined.scoreA ?? null, scoreB: parsed.combined.scoreB ?? null, result: parsed.combined.result ?? null } : null,
      comparison: parsed?.comparison ?? null,
      actualWinner: parsed?.actualWinner ?? null,
      frameMethodStatus: parsed?.frameMethodStatus ?? null,
    };
  });
}

export async function getSimulationResultDetail(runId: number, resultId: number) {
  const db = await getDb();
  const matching = db
    ? await db.select().from(simulationResults).where(eq(simulationResults.id, resultId)).limit(1)
    : (inMemoryResults.get(runId) ?? []).filter(result => result.id === resultId);
  const row = matching[0];
  if (!row || row.runId !== runId) return null;
  return {
    id: row.id,
    status: row.status,
    errorMessage: row.errorMessage,
    output: row.outputJson ? JSON.parse(row.outputJson) as unknown : null,
  };
}
