import { readFileSync } from "node:fs";
import { getSportsAIStatus } from "../server/_core/llm";
import { buildSportsAdjudication } from "../server/engine/sportsAdjudication";
import { buildSportsIntelligence } from "../server/engine/sportsIntelligence";
import {
  runSimulationEvent,
  type SimulationEventInput,
} from "../server/engine/simulationAdapter";
import { interpretSportsEvent } from "../server/masterSportsAstrologer";
import type { PregameConditions } from "../server/pregameConditions";

type Fixture = SimulationEventInput & { id: string; actualWinner: "A" | "B" };
const live = process.argv.includes("--live");
if (live && !getSportsAIStatus().configured)
  throw new Error("Set GEMINI_API_KEY to run the live benchmark.");

const data = JSON.parse(
  readFileSync(
    new URL("../real-events/historical-benchmark-games.json", import.meta.url),
    "utf8"
  )
) as { events: Fixture[] };
const fixtures = data.events
  .filter(
    row =>
      row.roleAssignmentSource === "market-odds" &&
      ["A", "B"].includes(row.actualWinner)
  )
  .sort(
    (a, b) =>
      Date.parse(a.startTime) - Date.parse(b.startTime) ||
      a.id.localeCompare(b.id)
  );
const holdout = fixtures.slice(-20);
if (holdout.length !== 20)
  throw new Error("The benchmark requires 20 market-assigned fixtures.");

const conditions: PregameConditions = {
  checkedAt: "",
  source: null,
  status: "not-verified",
  weather: null,
  injuries: [],
  severeWeather: false,
  availabilityStatus: "not-verified",
  notes: [],
};

async function benchmark() {
  const rows = [];
  for (const fixture of holdout) {
    // Only pregame fields cross the adjudication boundary.
    const {
      id,
      teamA,
      teamB,
      sport,
      location,
      latitude,
      longitude,
      startTime,
      roleAssignmentSource,
    } = fixture;
    const event = {
      id,
      teamA,
      teamB,
      sport,
      location,
      latitude,
      longitude,
      startTime,
      roleAssignmentSource,
    };
    const started = performance.now();
    const simulation = runSimulationEvent(event);
    const packet = buildSportsAdjudication(simulation, conditions);
    const deterministicMs = Math.round(performance.now() - started);
    const previousPayloadBytes = Buffer.byteLength(
      JSON.stringify(buildSportsIntelligence(simulation, conditions))
    );

    // A one-day cutoff leaves completed-event separation and avoids using same-day labels.
    const cutoff = Date.parse(startTime) - 86_400_000;
    const prior = fixtures.filter(
      row => row.sport === sport && Date.parse(row.startTime) <= cutoff
    );
    const priorFavoriteWins = prior.filter(
      row => row.actualWinner === "A"
    ).length;
    const favoriteRate = (priorFavoriteWins + 1) / (prior.length + 2);
    const response = live ? await interpretSportsEvent(event) : null;
    rows.push({
      id,
      actual: fixture.actualWinner,
      nonAstrological: {
        evidenceId: "BASE-SPORT-FAVORITE-RATE",
        pick: favoriteRate >= 0.5 ? "A" : "B",
        priorSample: prior.length,
        favoriteRate,
        cutoff: new Date(cutoff).toISOString(),
      },
      engineV1Baseline: simulation.synthesisView.valid
        ? simulation.synthesisView.winner
        : "NO_PICK",
      localV2: !packet.chartUsable
        ? "NO_PICK"
        : packet.ranking.lean === "ASC"
          ? "A"
          : packet.ranking.lean === "DSC"
            ? "B"
            : "NO_PICK",
      evidenceIds: packet.evidence.map(item => item.id),
      contradictionIds: packet.contradictions.map(row => row.id),
      evidenceBytes: Buffer.byteLength(JSON.stringify(packet)),
      previousPayloadBytes,
      deterministicMs,
      live: response
        ? {
            selected: response.prediction.selectedSide,
            source: response.prediction.source,
            ...response.analystAudit,
          }
        : null,
    });
  }
  const mean = (values: number[]) =>
    Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
  const acceptedMetrics = rows.flatMap(row =>
    row.live?.metrics ? [row.live.metrics] : []
  );
  const rate = (counts: Array<readonly [number, number]>) => {
    const total = counts.reduce((sum, [, supplied]) => sum + supplied, 0);
    return total ? counts.reduce((sum, [used]) => sum + used, 0) / total : null;
  };
  const summary = {
    fixtures: rows.length,
    mode: live ? "live" : "deterministic",
    marketFavoriteHits: rows.filter(row => row.actual === "A").length,
    baselineHits: rows.filter(row => row.nonAstrological.pick === row.actual)
      .length,
    engineV1Hits: rows.filter(row => row.engineV1Baseline === row.actual)
      .length,
    evaluatorV2Hits: rows.filter(row => row.localV2 === row.actual).length,
    evaluatorV2Picks: rows.filter(row => row.localV2 !== "NO_PICK").length,
    meanDeterministicMs: mean(rows.map(row => row.deterministicMs)),
    meanEvidenceBytes: mean(rows.map(row => row.evidenceBytes)),
    meanPreviousPayloadBytes: mean(rows.map(row => row.previousPayloadBytes)),
    accepted: live
      ? rows.filter(row => row.live?.status === "accepted").length
      : null,
    rejected: live
      ? rows.filter(row => row.live?.status === "invalid-judgment").length
      : null,
    citationCoverage: rate(
      acceptedMetrics.map(row => [row.citedEvidence, row.suppliedEvidence])
    ),
    contradictionCoverage: rate(
      acceptedMetrics.map(row => [
        row.contradictionsAddressed,
        row.contradictionsSupplied,
      ])
    ),
    acceptedHits: live
      ? rows.filter(
          row =>
            row.live?.status === "accepted" && row.live.selected === row.actual
        ).length
      : null,
  };
  process.stdout.write(JSON.stringify({ summary, rows }, null, 2) + "\n");
}

void benchmark().catch(error => {
  console.error(error instanceof Error ? error.message : "Benchmark failed");
  process.exitCode = 1;
});
