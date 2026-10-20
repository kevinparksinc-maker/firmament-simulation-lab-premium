/** Deterministic, never-with-replacement fixture selection.
 * The CSV's source order is retained, so first 200 means rows 1-200,
 * not 200 synthetic replays of the same event.
 */
export const SUPPORTED_INDEPENDENT_GAME_COUNTS = [1, 200, 10000] as const;
export type IndependentGameCount = (typeof SUPPORTED_INDEPENDENT_GAME_COUNTS)[number];

export function selectIndependentGameCount<T>(events: readonly T[], requested: IndependentGameCount): T[] {
  if (!SUPPORTED_INDEPENDENT_GAME_COUNTS.includes(requested)) {
    throw new RangeError("Select exactly 1, 200 or 10000 real historical games.");
  }
  if (events.length < requested) {
    throw new RangeError(`Dataset has ${events.length} valid games; ${requested} are required. No games will be duplicated or fabricated.`);
  }
  return events.slice(0, requested);
}
