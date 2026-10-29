# Planet / Aspect / House power integration — Manus acceptance contract

## Critical clarification
The existing Shadbala branch contains a strict six-component aggregator and documentation, NOT completed classical Shadbala, Bhavabala, or full Energy Read integration. Do not represent this branch as a drop-in finished implementation. Do not merge until acceptance checks below pass.

## Three distinct layers
1. Planetary strength: seven classical grahas, full Shadbala subcomponent breakdown and strength ratio against planet-specific traditional minima. Never call the ratio a win probability.
2. House strength: classical Bhavabala, explicitly broken down by house lord strength, directional house strength, and planetary aspectual effects on each house under a selected documented tradition. Use exact equal-house cusps and custom God/Agent framing. Compute 12 house values independently; no fabricated default scores.
3. Aspect strength: angular orb closeness + verified classical drishti when the technique requires it; distinguish geometric orb magnitude from benefic/malefic interpretation. Do not count Shadbala Drik Bala again as independent evidence.

## Energy Read V2 requirements
- Existing Energy Read V2 5/5/5 and 3-style planet/aspect weights are heuristic configuration, not measured planetary strengths.
- Preserve V2 baseline scores and exact per-contact evidence.
- Add an opt-in research mode using normalized planetary-strength multipliers with prespecified bounds and clipping; retain raw score and adjusted score per aspect, showing every multiplier and its source.
- Do NOT automatically replace existing weights or hard-code a formula for multiplying two planets' strengths until out-of-sample testing supports that mapping.
- Conjunctions count harmonious under the app's current Energy Read rules; keep the existing 8-aspect classification intact unless the user approves a change.
- Test Shadbala-only, Bhavabala-only, aspect-only and combined variants against original V2, including ablations and leakage-free holdouts.
- The Absolute's Energy Read is a separate repository: this Simulation Lab branch cannot update it. After validating the new calculation contract, create a corresponding implementation branch in `kevinparksinc-maker/firmament-guardian`, wire natal+transit chart evidence and show original/adjusted scores in the UI.

## Delivery gates before merging
- Complete six classical Shadbala calculators, twelve-house Bhavabala calculators, and aspect strength evaluator with cited formula variants, independent golden fixtures and source provenance.
- Validate canonical chart inputs and exact birth/event time, timezone, and locations; reconcile existing unmerged ephemeris branches first.
- Implement pure-function tests for boundary cases and verify no double-counting.
- Wire through live engine and UI, add regression tests, run typecheck/test/build, show example output, document results.
- Keep incomplete features evidence-only and behind an explicit research mode; no false "production ready" claims.
