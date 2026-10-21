/** Deterministic, never-with-replacement fixture selection.
 * The CSV's source order is retained, so first 200 means rows 1-200,
 * not 200 synthetic replays of the same event.
 */
export const SUPPORTED_INDEPENDENT_GAME_COUNTS = [1, 200, 10000] as const;
export type IndependentGameCount = (typeof SUPPORTED_INDEPENDENT_GAME_COUNTS)[number];

export function selectIndependentGameCount<T>(
  events: readonly T[],
  requested: IndependentGameCount,
  eventIdentity?: (event: T) => string,
): T[] {
  if (!SUPPORTED_INDEPENDENT_GAME_COUNTS.includes(requested)) {
    throw new RangeError("Select exactly 1, 200 or 10000 real historical games.");
  }
  if (events.length < requested) {
    throw new RangeError(`Dataset has ${events.length} valid games; ${requested} are required. No games will be duplicated or fabricated.`);
  }
  const selected = events.slice(0, requested);
  if (eventIdentity) {
    const unique = new Set<string>();
    for (const row of selected) {
      const id = eventIdentity(row);
      if (!id) throw new Error("An event is missing the information required for duplicate checking.");
      if (unique.has(id)) {
        throw new Error(`Repeated historical fixture detected (${id}). Remove duplicate dataset records before testing; no games were substituted.`);
      }
      unique.add(id);
    }
  }
  return selected;
}

/** Event identity is season/time, sport, opponent pairing and venue, not a
 * mutable CSV row number. A/B team order may be reversed in home/away files.
 */
export function historicalFixtureIdentity(event: {
  sport: string;
  startTime: string;
  teamA: string;
  teamB: string;
  location: string;
}) {
  const teams = [event.teamA.trim().toLowerCase(),event.teamB.trim().toLowerCase()].sort();
  return [event.sport.toLowerCase(),new Date(event.startTime).toISOString(),...teams,event.location.trim().toLowerCase()].join("|");
}
