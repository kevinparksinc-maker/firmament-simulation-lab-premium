import fs from "node:fs";
import { runSimulationBatch } from "../server/engine/simulationAdapter";

const source = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=09/24/2026&hydrate=venue,team";
const saved = JSON.parse(fs.readFileSync("real-events/mlb-2026-09-24-simulation.json", "utf8"));
const events = saved.events.map((event: any) => ({
  id: event.id,
  teamA: event.teamA,
  teamB: event.teamB,
  sport: event.sport,
  location: event.location,
  startTime: event.startTime,
  actualWinner: event.actualWinner,
}));
const batch = runSimulationBatch(events);
const layers = ["harmonics", "varga", "ashtakavarga", "dasha"] as const;
const aggregate = (frame: "godView" | "agentView", name: (typeof layers)[number]) => {
  const rows = batch.results.map((result: any) => result.experimentalLayers[frame][name].verdict);
  const hits = rows.filter((row: any, index: number) => row.winner === events[index].actualWinner).length;
  const ties = rows.filter((row: any) => row.winner === "TIE").length;
  const misses = rows.length - hits - ties;
  return { hits, misses, ties, rate: Number((hits / Math.max(hits + misses, 1) * 100).toFixed(1)) };
};

const report: string[] = [
  "# Upgraded MLB September 24, 2026 Backtest",
  "",
  `Source: [MLB Stats API](${source})`,
  "",
  `**${events.length} verified final games**. Side A is away; Side B is home.`,
  "",
  "## God View aggregate",
  "",
  "| Layer | Hits | Misses | Ties | Evaluable hit rate |",
  "|---|---:|---:|---:|---:|",
];
for (const name of layers) {
  const result = aggregate("godView", name);
  report.push(`| ${name} | ${result.hits} | ${result.misses} | ${result.ties} | ${result.rate.toFixed(1)}% |`);
}
report.push(`| baseline | ${batch.summary.baselineHits} | ${batch.summary.baselineMisses} | 0 | ${batch.summary.baselineAccuracy}% |`);
report.push("", "## Agent View aggregate", "", "| Layer | Hits | Misses | Ties | Evaluable hit rate |", "|---|---:|---:|---:|---:|");
for (const name of layers) {
  const result = aggregate("agentView", name);
  report.push(`| ${name} | ${result.hits} | ${result.misses} | ${result.ties} | ${result.rate.toFixed(1)}% |`);
}
const ashtakaTies = batch.results.filter((result: any) => result.experimentalLayers.godView.ashtakavarga.verdict.winner === "TIE").length;
report.push(
  "",
  "## Ashtakavarga diagnostics",
  "",
  `- God View ties: ${ashtakaTies}/${events.length}`,
  "- The upgraded layer uses classical BAV row checksums and Lagna as an eighth reference.",
  "- The A/B result remains an application-specific projection of the SAV map.",
  "",
  "## Notes",
  "",
  "- Experimental backtest only; no production winner was changed.",
  "- The upgraded Dasha layer uses its event-time fallback because no natal context was supplied.",
  "",
);
fs.writeFileSync("real-events/mlb-2026-09-24-upgraded-backtest.json", JSON.stringify({ source, events, simulation: batch }, null, 2) + "\n");
fs.writeFileSync("real-events/mlb-2026-09-24-upgraded-backtest.md", report.join("\n"));
console.log(JSON.stringify({ summary: batch.summary, godView: Object.fromEntries(layers.map((name) => [name, aggregate("godView", name)])), agentView: Object.fromEntries(layers.map((name) => [name, aggregate("agentView", name)])) }, null, 2));
