import type { GameInput } from "./firmamentEngine";
import type { SimulationEventInput } from "./simulationAdapter";

/**
 * Single truth for all methods and all runners:
 * A is the user-declared market favorite if supplied, otherwise input.teamA.
 * B is the underdog if supplied, otherwise input.teamB.
 * House families are assigned by the chart, NOT by home/away.
 * Market-odds provenance must be explicit and available when asserted.
 */
export type ResolvedEventContract = {
  gameInput: GameInput;
  startTime: Date;
  favoredTeam: string;
  underdogTeam: string;
  roleAssignmentSource: NonNullable<SimulationEventInput["roleAssignmentSource"]>;
  oddsSource: string | null;
  provenanceWarning: string | null;
};

const nonempty = (value: string | undefined): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function resolveEventContract(input: SimulationEventInput): ResolvedEventContract {
  const startTime = new Date(input.startTime);
  if (!Number.isFinite(startTime.getTime())) throw new RangeError("startTime must be a valid time.");
  const favoredTeam = nonempty(input.favoredTeam) ?? nonempty(input.teamA);
  const underdogTeam = nonempty(input.underdogTeam) ?? nonempty(input.teamB);
  if (!favoredTeam || !underdogTeam) throw new Error("Both teams must be identified.");
  if (favoredTeam.toLowerCase() === underdogTeam.toLowerCase()) {
    throw new Error("Ascendant and Descendant may not be assigned to the same team.");
  }
  // API callers sometimes send home/away as teamA/B. The explicit market
  // favorite controls the predictive A side, regardless of home order.
  // actualWinner A/B is defined against this RESOLVED favorite/underdog order.
  // Importers must normalize source winner-name data accordingly.
  const oddsSource = nonempty(input.oddsSource);
  const explicitMarketSides = Boolean(nonempty(input.favoredTeam) && nonempty(input.underdogTeam));
  const verifiedProvenanceFields = explicitMarketSides && Boolean(oddsSource);
  const requestedRole = input.roleAssignmentSource ??
    (explicitMarketSides ? (oddsSource ? "market-odds" : "manual") : "legacy-side-order");
  // Historical test files often asserted market-odds before a provider and
  // timestamp were saved. Keep them calculable, but they MUST NOT qualify as
  // independently sourced market-favorite accuracy examples.
  const provenanceWarning = requestedRole === "market-odds" && !verifiedProvenanceFields
    ? "Market-odds label downgraded: missing explicit favorite/underdog or oddsSource. This game is not market-verified."
    : null;
  const roleAssignmentSource = provenanceWarning
    ? (explicitMarketSides ? "manual" : "legacy-side-order")
    : requestedRole;
  if ((input.latitude === undefined) !== (input.longitude === undefined)) {
    throw new Error("Coordinates require both latitude and longitude.");
  }
  if (input.latitude !== undefined &&
      (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90 ||
       !Number.isFinite(input.longitude) || input.longitude! < -180 || input.longitude! > 180)) {
    throw new Error("Invalid venue latitude/longitude.");
  }
  const sunriseTime = input.sunriseTime ? new Date(input.sunriseTime) : undefined;
  if (sunriseTime && !Number.isFinite(sunriseTime.getTime())) throw new Error("Invalid sunriseTime.");
  if (input.agentViewModel === "fixed-earth-dawn-anchored" && !sunriseTime) {
    throw new Error("Dawn-anchored Agent View requires sunriseTime.");
  }
  const gameInput: GameInput = {
    teamA: favoredTeam,
    teamB: underdogTeam,
    gameType: input.sport,
    location: input.location,
    startTime,
    ...(input.latitude !== undefined ? { coordinates: { latitude: input.latitude, longitude: input.longitude! } } : {}),
    ...(sunriseTime ? { sunriseTime } : {}),
    ...(input.sunriseSource ? { sunriseSource: input.sunriseSource } : {}),
    ...(input.agentViewModel ? { agentViewModel: input.agentViewModel } : {}),
  };
  return { gameInput, startTime, favoredTeam, underdogTeam, roleAssignmentSource, oddsSource, provenanceWarning };
}
