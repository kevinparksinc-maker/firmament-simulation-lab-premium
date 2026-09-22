import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { runSimulationBatch, runSimulationEvent, type SimulationEventInput } from "./engine/simulationAdapter";
import { executeSimulationRun } from "./batchRunner";
import { createSimulationDataset, createSimulationRun, getSimulationEvents, getSimulationRun, insertSimulationEvents, listSimulationDatasets, listSimulationRuns, updateSimulationRun } from "./simulationDb";
import { parseSimulationCsv } from "./simulationData";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { listScheduledGames } from "./schedules";
import { invokeLLM } from "./_core/llm";

const eventInput = z.object({
  id: z.string().optional(),
  teamA: z.string().min(1),
  teamB: z.string().min(1),
  sport: z.enum(["MLB", "NBA", "NFL", "boxing"]),
  location: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  startTime: z.string().datetime(),
  actualWinner: z.enum(["A", "B", "TIE"]).optional(),
  agentViewModel: z.enum(["astronomical", "fixed-earth-dawn-anchored"]).optional(),
  sunriseTime: z.string().datetime().optional(),
  sunriseSource: z.string().max(180).optional(),
}) satisfies z.ZodType<SimulationEventInput>;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  datasets: router({
    list: publicProcedure.query(() => listSimulationDatasets()),
    importCsv: publicProcedure.input(z.object({
      name: z.string().min(1).max(180),
      sourceFileName: z.string().max(255).optional(),
      sourceDescription: z.string().max(2000).optional(),
      csv: z.string().min(1).max(5_000_000),
    })).mutation(async ({ input }) => {
      const parsed = parseSimulationCsv(input.csv);
      if (parsed.valid.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No valid event rows were found." });
      const datasetId = await createSimulationDataset({
        name: input.name,
        sourceFileName: input.sourceFileName,
        sourceDescription: input.sourceDescription,
        rowCount: parsed.valid.length + parsed.invalid.length,
        validRowCount: parsed.valid.length,
        invalidRowCount: parsed.invalid.length,
      });
      if (!datasetId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not available for dataset persistence." });
      await insertSimulationEvents(datasetId, parsed.valid);
      return {
        datasetId,
        headers: parsed.headers,
        rowCount: parsed.valid.length + parsed.invalid.length,
        validRowCount: parsed.valid.length,
        invalidRowCount: parsed.invalid.length,
        invalidPreview: parsed.invalid.slice(0, 25),
        status: parsed.invalid.length > 0 ? "partial" as const : "validated" as const,
      };
    }),
  }),
  ai: router({
    chat: publicProcedure.input(z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().min(1).max(6000) })).min(1).max(20), context: z.string().max(12000).optional() })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are the Firmament research assistant. Explain the app's recorded inputs, market data, chart frames, and audit statuses clearly. Never invent missing data. Distinguish unverified (no confirmed actual result) from not evaluable (a method could not be scored). Do not present astrology calculations as guaranteed predictions or betting advice.${input.context ? `\n\nCurrent result context:\n${input.context}` : ""}` },
          ...input.messages,
        ],
      });
      const content = response.choices?.[0]?.message?.content;
      return { content: typeof content === "string" ? content : "I could not produce a response from the available research record." };
    }),
  }),
  schedules: router({
    list: publicProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sport: z.enum(["ALL", "MLB", "NBA", "NFL"]).default("ALL") })).query(({ input }) => listScheduledGames(input.date, input.sport)),
  }),
  runs: router({
    list: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(8) }).optional()).query(({ input }) => listSimulationRuns(input?.limit ?? 8)),
    start: publicProcedure.input(z.object({ datasetId: z.number().int().positive() })).mutation(async ({ input }) => {
      const events = await getSimulationEvents(input.datasetId);
      if (events.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "No valid events found in this dataset." });
      const runId = await createSimulationRun(input.datasetId, events.length);
      if (!runId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not available for run persistence." });
      void executeSimulationRun(runId, input.datasetId).catch(async (error) => {
        await updateSimulationRun(runId, { status: "failed", finishedAt: new Date(), summaryJson: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown batch error" }) });
      });
      return { runId, status: "running" as const, totalEvents: events.length };
    }),
    get: publicProcedure.input(z.object({ runId: z.number().int().positive() })).query(async ({ input }) => {
      const run = await getSimulationRun(input.runId);
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation run not found." });
      return {
        ...run,
        progressPercent: run.totalEvents ? Math.round(((run.completedEvents + run.failedEvents) / run.totalEvents) * 100) : 0,
        summary: run.summaryJson ? JSON.parse(run.summaryJson) : null,
      };
    }),
  }),
  simulate: router({
    event: publicProcedure.input(eventInput).mutation(({ input }) => runSimulationEvent(input)),
    batch: publicProcedure.input(z.object({ events: z.array(eventInput).min(1).max(10000) })).mutation(({ input }) => runSimulationBatch(input.events)),
  }),
});

export type AppRouter = typeof appRouter;
