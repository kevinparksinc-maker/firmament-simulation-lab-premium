# Manus correction handoff — canonical chart-input validation

## Actual code corrections on this branch
- `server/engine/guardianEphemerisAdapter.ts`: reject missing/undefined provider results before dereferencing; validate optional UTC timestamp matches the exact requested event instant, in addition to existing planet, frame, source and longitude checks.
- `server/engine/guardianEphemerisAdapter.test.ts`: new regression tests for missing result, stale timestamp and valid timestamp.

## Why these corrections matter
An adapter label alone does not prove that real Swiss Ephemeris mode-14 calculations were performed. A stale or absent result must not be accepted as a chart position. Existing code accepts unstamped positions for backward compatibility; **making timestamps mandatory** should happen when the live provider and its call sites are migrated together.

## Remaining integration — implement before declaring chart parity
1. Locate the real ACTIVE Guardian/The Absolute provider and verify its exact computation and Aldebaran calibration. The existing `requireGuardianPosition` takes a provider callback; it does not create one.
2. Replace active `generateFixedJ2000KPPrediction` / `generateFixedJ2000PlanetReadings` use in `server/engine/simulationAdapter.ts` and all downstream callers with verified canonical outputs; do not simply relabel old astronomy-engine longitudes.
3. Require a timestamp on all canonical outputs once every real provider caller supplies one. Ensure no silent fallback. Validate 12 bodies including lunar nodes and planet identifiers.
4. Use one set of planet longitudes for God and Agent, differing only in house anchor. Reconcile zodiac-forward house correction in PR #45.
5. The `server/engine/chineseMansions.ts` default is ICRS_J2000 RA. Define and implement an explicitly approved fixed-zodiac-degree Chinese mansion mapping before enabling it as the default. Keep the RA version distinctly labeled research mode; never fake the mapping.
6. Verify elemental decans, 27 Nakshatras, 28 Manzils, 10 fixed stars and their exact boundary tests from the same canonical longitude. Trace whether active `Chaldean Decans` scoring remains and correct it to the approved elemental-family rules.
7. Test at least two UTC instants and two locations against the live Guardian/The Absolute chart API, assert numerical planet parity, ascendant and house parity, source metadata and absence of J2000 fallback. Run `npm run check`, `npm test`, `npm run build` and full event API smoke test.
8. Rebase against PR #45 and coordinate with PR #44; version historical outputs before rerunning 100,000 simulations.

**Status:** The missing/stale position validation is committed. Real provider wiring, canonical planet calculations, Chinese mansion remapping and downstream chart parity are NOT implemented or tested on this branch. Do not merge as full chart parity.
