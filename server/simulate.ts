import { formatSimulationReport, runAndBuildSimulationReport, writeSimulationExports } from "./simulationReport";

const fixtures = [
  {
    id: "terminal-game-001-dodgers-giants",
    teamA: "Los Angeles Dodgers",
    teamB: "San Francisco Giants",
    sport: "MLB" as const,
    location: "Los Angeles, CA",
    latitude: 34.0522,
    longitude: -118.2437,
    startTime: "2024-06-15T19:10:00.000Z",
    actualWinner: "A" as const,
  },
  {
    id: "terminal-game-002-yankees-astros",
    teamA: "New York Yankees",
    teamB: "Houston Astros",
    sport: "MLB" as const,
    location: "Houston, TX",
    latitude: 29.7604,
    longitude: -95.3698,
    // 7:10 PM CDT in Houston = 2024-04-02 00:10 UTC.
    startTime: "2024-04-02T00:10:00.000Z",
    actualWinner: "B" as const,
  },
];

async function main() {
  const report = runAndBuildSimulationReport(fixtures);
  console.log(formatSimulationReport(report));
  const exports = await writeSimulationExports(report);
  console.log(`JSON export: ${exports.jsonPath}`);
  console.log(`CSV export:  ${exports.csvPath}`);
}

void main();
