# Chart, planet and fixed-star parity — implementation handoff (2026-10-29)

**Scope:** Fix chart inputs BEFORE auditing the 31 scoring methods or running 100,000 simulations. This branch contains a source-level audit and actionable implementation contract; it does not falsely claim an ephemeris replacement is already wired.

## Confirmed code findings
1. `server/engine/firmamentEngine.ts` imports `astronomy-engine`, exposes `fixedJ2000EclipticLongitude`, `j2000RaDegrees`, `fixedJ2000ObliquityDegrees: 0`, `nodeObliquityDegrees: 0`, and `royalStarJ2000RA`. This remains a distinct calculation path, not demonstrated equivalent to Guardian's canonical mode-14 output.
2. `server/engine/simulationAdapter.ts` imports `generateFixedJ2000KPPrediction` and `generateFixedJ2000PlanetReadings` from `./index`, then uses them in chart snapshots. This is direct evidence the active simulation adapter is still connected to the old path. Trace all entry points to determine every caller and output affected.
3. `server/engine/guardianEphemerisAdapter.ts` defines `requireGuardianPosition(provider,date,planet)` and rejects wrong source/frame. It does NOT instantiate or call a real Guardian/Swiss provider; its test supplies a mock function returning longitude 45. A parity contract is not a live data integration.
4. `server/engine/guardianFixedCanon.ts` has the matching locked Aldebaran 45° / Taurus 15° anchor, ten fixed-star reference degrees and elemental-family decans; these match `firmament-guardian/shared/hybrid.ts` for those constants. This proves constants parity only, NOT live planet-position parity. Star coordinates are explicitly labeled symbolic locked degrees, not independently measured historical positions.
5. `server/engine/chineseMansions.ts` currently compiles a Stellarium `ICRS_J2000` right-ascension catalog and scores `j2000RaDegrees`. User-approved default instead requires zodiac-degree-linked mansions in the same fixed wheel; do not silently represent an RA/J2000 assignment as that default. Preserve optional historical/RA research mode only if separately labeled, with its own documented coordinate contract.
6. `server/engine/firmamentEngine.ts` still includes the label `Chaldean Decans` in the scoring-layer type; determine whether the active formula still uses Chaldean faces despite Guardian's elemental decan canon.
7. Separate branch `fix/house-order-zodiac-forward-handoff-20261029` and draft PR #45 correct reverse Equal House mapping; coordinate work must integrate that change, not reintroduce reverse house order.

## Required implementation, in order
A. Trace execution from actual event input/API -> chart provider -> all planet/node positions -> Aldebaran transformation -> fixed-star/mansion/decan overlay -> God/Agent charts -> `simulationAdapter` -> registered methods. Document exact call sites and show one trace per frame.
B. Inspect The Absolute/Guardian **actual active** provider implementation and API response (not merely `shared/hybrid.ts` or a commit message). Confirm what 'mode-14' returns, which raw longitudes it uses, the Aldebaran calibration equation, timestamp/UTC handling, and reference-frame identifier. If provider or calibration is missing, report BLOCKED; never invent longitudes or substitute `astronomy-engine`.
C. Implement a concrete provider adapter using that verified source, or an explicitly configured same-library provider with identical verified calculations. Fail closed if missing; no silent tropical/J2000 fallback. Return per-body `{planet, longitude, referenceFrame, source, timestamp}` plus trace metadata and validation. Cover Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Rahu and Ketu according to canonical rules.
D. Replace/route every active chart-building and scoring entry point through the canonical provider. God and Agent MUST share planet longitudes; only house anchor differs. Agent uses correct eastern zero-tilt Ascendant; equal 30° cusps advance zodiac-forward, retaining degree precision. Verify the correct local event coordinates and UTC instant are passed; do not synthesize venue latitude/longitude.
E. Derive 27 Nakshatras, 28 Arabic Manzils, 36 elemental-family decans, fixed-star separations and Chinese mansions from the SAME canonical zodiac longitude. Chinese mansion sector boundaries must be explicitly approved and documented; do not silently convert a RA catalogue to zodiac sectors or fabricate historical observations. Mark any missing mapping UNAVAILABLE, not scored.
F. Replace active Chaldean decan scoring with approved elemental-family rule where appropriate; ensure labels reflect actual formulas. Audit all fixed-star displays independent of aspect orb.
G. Merge or rebase PR #45's zodiac-forward house correction; reconcile draft PR #44's overlapping wheel changes. Version saved results by calculation engine, reference frame, star catalog, house rule and scoring version; invalidate or segregate old simulations.

## Mandatory acceptance tests (Vitest + API integration)
- For identical timestamp, every planet's canonical longitude is identical in God and Agent; sign/degree/mansion/decan and fixed-star separation match Guardian.
- Aldebaran fixed at 45°, Antares and other fixed stars agree with canonical locked list; no hidden J2000/precession/obliquity transformation in the selected default path.
- Known chart fixtures: user's approved test chart (1986-11-20 10:06 CST, Dallas) only after canonical provider outputs are independently established; compare full numerical positions, not just sign labels. Also test one event with wraparound 359.99° -> 0.01°, and different event venues at same UTC instant.
- Ascendant east horizon, equal-house cusp boundaries, H1-H12 zodiac-forward; Moon nodes and retrograde status from canonical source.
- Every mansion/decan assignment boundary, including 27/28/36 cycles; explicit unavailable state for missing Chinese mapping.
- Assert active simulation API cannot emit `fixedJ2000` or `astronomy-engine` coordinates under canonical reference-frame label.
- Run `npm run check`, `npm test`, `npm run build`, and one full event through the real simulation endpoint. Report failures and file locations. No tests have been executed by ChatGPT for this audit.

## Completion gate
Do NOT mark chart parity COMPLETE or start a 100,000-game backtest until a real provider, all active callers, numerical fixtures, regression tests, and main-branch integration are verified. After chart parity, audit all 31 methods' inputs, scoring formulas, God/Agent/Synthesis output and score trace.
