# Simulation Lab Premium — Methods and doctrines integrity handoff

## Implemented in this branch
- `server/engine/methodRegistry.ts`: propagate optional natal context from snapshot runner; fail closed on invalid event time, mismatched method identity/version/mode, invalid numeric scores, or evidence-only methods pretending to be predictive.
- `server/engine/methodRegistry.integrity.test.ts`: initial regression coverage.

## Audit findings requiring further correction
1. `METHOD_REGISTRY` on main defines **11 entries**, not 31: Chinese mansion research, HARMONICS V1/V2, five Vargas, Ashtakavarga, event lunar dasha, natal Vimshottari. The separately claimed 21 core methods are elsewhere in the engine and not all registered here. Do not call this a certified 31-method registry.
2. `crossFrameSynthesis.ts` hardcodes exactly 21 matching method names per frame and 50/50 coefficients; it does not synthesize all 31 registered + legacy techniques. Preserve separate provenance and fix only after a complete method inventory.
3. `HARMONICS_V2` multiplies zodiac longitudes by harmonic before applying 5° orb. This is a **transformed-space 5°** orb (equivalent to 5/n zodiac degrees), not necessarily the requested 5° zodiac orb. Specify the approved definition, version it, and test boundaries before modifying scores.
4. `CHINESE_28_XIU_STELLAR_RA_V1` uses J2000 RA and is evidence-only. Do not pass it off as the approved zodiac-degree Chinese mansion default.
5. `EVENT_LUNAR_DASHA_CHAIN_V1` is event-time nakshatra/sub chain, not a substitute for **natal Vimshottari**. Natal method must have actual birth-time context and should be withheld without it.
6. `DEFAULT_HOUSE_FAMILIES` correctly assigns A 1,2,3,6,10,11 and B 4,5,7,8,9,12, but upstream house-order correction in PR #45 remains necessary.
7. Multiple varga variants and harmonic V1/V2 use related input data; verify independent predictive lift and avoid presenting correlated outputs as 31 independent votes.

## Next steps
- Inventory the 21 legacy engine methods and 11 registry entries; reconcile names, duplicate doctrines, quarantined evidence and true predictive methods.
- For each: list source formula, input frame, houses, planet weights, orb definitions, God/Agent scoreA/B, synthesis, expected invariants and actual test fixtures.
- Feed actual canonical Swiss/Aldebaran longitudes only after the planetary provider correction; do not relabel J2000 output.
- Write golden fixtures and parity tests; run npm run check, npm test, npm run build; resolve PR #44/#45 conflicts.
- Keep evidence-only methods unscored. Never fabricate numeric results for unevaluable doctrines.

## Status
Registry validation and natal-context pass-through committed. Not merged, not executed or tested. Remaining doctrine corrections are findings and integration instructions, not completed changes.
