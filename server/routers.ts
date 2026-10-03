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
import { listLiveGames, listScheduledGames } from "./schedules";
import { invokeLLM } from "./_core/llm";
import { buildPersonalChart, type PersonalChartInput } from "./engine/personalChart";
import { runSportsFeatureExperiment } from "./engine/sportsFeatureExperiment";

const eventInput = z.object({
  id: z.string().optional(),
  teamA: z.string().min(1),
  teamB: z.string().min(1),
  sport: z.enum(["MLB", "NBA", "NFL", "NHL", "MLS", "NCAAF", "NCAAB", "boxing"]),
  location: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  startTime: z.string().datetime(),
  actualWinner: z.enum(["A", "B", "TIE"]).optional(),
  agentViewModel: z.enum(["astronomical", "fixed-earth-dawn-anchored"]).optional(),
  sunriseTime: z.string().datetime().optional(),
  sunriseSource: z.string().max(180).optional(),
}) satisfies z.ZodType<SimulationEventInput>;

const personalChartInput = z.object({
  birthDateTime: z.string().datetime(),
  birthLocation: z.string().min(1).max(180),
  birthLatitude: z.number().min(-90).max(90),
  birthLongitude: z.number().min(-180).max(180),
  transitDateTime: z.string().datetime(),
  transitLocation: z.string().min(1).max(180),
  transitLatitude: z.number().min(-90).max(90),
  transitLongitude: z.number().min(-180).max(180),
}) satisfies z.ZodType<PersonalChartInput>;

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
    chartChat: publicProcedure.input(z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000) })).min(1).max(20), chartContext: z.string().min(1).max(30000) })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are the Firmament personal astrology guide. Answer ordinary questions using only the provided natal/transit chart evidence. Explain zodiac, houses, decans, Arabic Manzils, Vedic Nakshatras, fixed-star contacts, and geometric relationships in clear language. Distinguish calculated evidence from interpretation. Never invent a placement, never claim certainty, and do not give medical, legal, financial, or guaranteed prediction advice. When discussing sports or outcomes, frame it as experimental research, not betting advice.\n\nNatal and transit chart evidence:\n${input.chartContext}` },
          ...input.messages,
        ],
      });
      const content = response.choices?.[0]?.message?.content;
      return { content: typeof content === "string" ? content : "I could not produce a chart-based response from the available evidence." };
    }),
    personalReading: publicProcedure.input(personalChartInput).mutation(async ({ input }) => {
      const chart = buildPersonalChart(input);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are the Firmament synthesis engine. Write a detailed but grounded personal reading from the supplied chart evidence. Cover natal identity, current transit themes, houses, Arabic Manzils, Vedic Nakshatras, decans, exact aspects, orbs, and cross-layer convergences. Clearly separate calculated placements from interpretive language. Do not invent missing information or make guaranteed claims. Do not provide medical, legal, financial, or betting advice." },
          { role: "user", content: `Generate the personal synthesis for this exact evidence:\n${JSON.stringify(chart)}` },
        ],
      });
      const content = response.choices?.[0]?.message?.content;
      return { chart, interpretation: typeof content === "string" ? content : "The chart was calculated, but the interpretation layer did not return text." };
    }),
  }),
  schedules: router({
    list: publicProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sport: z.enum(["ALL", "MLB", "NBA", "NFL", "NHL", "MLS", "NCAAF", "NCAAB"]).default("ALL") })).query(({ input }) => listScheduledGames(input.date, input.sport)),
    live: publicProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ input }) => listLiveGames(input.date)),
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
  personal: router({
    chart: publicProcedure.input(personalChartInput).mutation(({ input }) => buildPersonalChart(input)),
  }),
  experiments: router({
    sportsFeatures: publicProcedure.input(z.object({ events: z.array(eventInput).min(1).max(1000) })).mutation(({ input }) => runSportsFeatureExperiment(input.events)),
  }),
});

export type AppRouter = typeof appRouter;
