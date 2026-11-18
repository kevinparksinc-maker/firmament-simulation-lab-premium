import { buildUnifiedMasterChart } from "../masterChart/builder";
import type { MasterChartInput } from "../masterChart/types";
import tzLookup from "tz-lookup";

export type GuardianMasterChartInput = {
  birthDateTime: string;
  birthLocation: string;
  birthLatitude: number;
  birthLongitude: number;
  transitDateTime?: string;
  transitLocation?: string;
  transitLatitude?: number;
  transitLongitude?: number;
};

function localParts(iso: string, timezone: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) throw new Error("Chart date-times must be valid ISO dates.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function finiteCoordinate(value: number | undefined, label: string): number {
  if (value === undefined || !Number.isFinite(value)) throw new Error(`${label} coordinates are required for the Guardian master chart.`);
  return value;
}

/**
 * Runs the Guardian master-chart stack inside Simulation Lab. The sports
 * engine remains unchanged; this is the authoritative chart/evidence layer
 * that can be attached to an event or personal research record.
 */
export async function calculateGuardianMasterChart(input: GuardianMasterChartInput) {
  const birthLatitude = finiteCoordinate(input.birthLatitude, "Birth");
  const birthLongitude = finiteCoordinate(input.birthLongitude, "Birth");
  const birthTimezone = tzLookup(birthLatitude, birthLongitude);
  const birth = localParts(input.birthDateTime, birthTimezone);
  const transitLatitude = input.transitLatitude === undefined ? undefined : finiteCoordinate(input.transitLatitude, "Transit");
  const transitLongitude = input.transitLongitude === undefined ? undefined : finiteCoordinate(input.transitLongitude, "Transit");
  const transitTimezone = transitLatitude === undefined || transitLongitude === undefined
    ? undefined
    : tzLookup(transitLatitude, transitLongitude);
  const transit = input.transitDateTime && transitTimezone ? localParts(input.transitDateTime, transitTimezone) : undefined;
  const mode: MasterChartInput["mode"] = transit ? "combined" : "natal";

  const chartInput: MasterChartInput = {
    location: input.birthLocation,
    latitude: birthLatitude,
    longitude: birthLongitude,
    timezone: birthTimezone,
    date: birth.date,
    time: birth.time,
    transitLocation: transit ? input.transitLocation : undefined,
    transitLatitude,
    transitLongitude,
    transitTimezone,
    transitDate: transit?.date,
    transitTime: transit?.time,
    mode,
    worldview: "agent-vs-god",
    birthTimeKnown: true,
    chartRole: "event",
  };
  return buildUnifiedMasterChart(chartInput);
}

export function summarizeGuardianMasterChart(snapshot: Awaited<ReturnType<typeof calculateGuardianMasterChart>>) {
  return {
    snapshotId: snapshot.snapshotId,
    engineVersion: snapshot.frameConfig.engineVersion,
    mode: snapshot.inputs.mode,
    totalMethods: snapshot.validation.totalMethods,
    computedWithResultCount: snapshot.validation.computedWithResultCount,
    complete: snapshot.validation.complete,
    errors: snapshot.validation.errors,
    warnings: snapshot.validation.warnings,
    ascendantLongitude: snapshot.baseCelestialState.ascendant?.longitude ?? 0,
    planets: snapshot.baseCelestialState.planets.map(planet => ({
      body: planet.name,
      longitude: planet.longitude,
      display: planet.display,
      sign: planet.display.split(" ")[0],
      godHouse: planet.godHouse,
      agentHouse: planet.agentHouse,
      retrograde: planet.retrograde,
    })),
    houses: snapshot.baseCelestialState.houses,
    methodLedger: snapshot.methodExecutionLedger,
    transit: snapshot.transit ? {
      instantUtc: snapshot.transit.transitInstantUtc,
      planetCount: snapshot.transit.planets.length,
      aspectCount: snapshot.transit.aspectsToNatal.length,
    } : null,
  };
}
