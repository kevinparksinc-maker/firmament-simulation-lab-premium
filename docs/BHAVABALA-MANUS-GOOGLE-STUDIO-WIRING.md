# Bhavabala implementation and wiring — Manus / Google AI Studio

## Files delivered on this branch
- `server/engine/bhavabala.ts`: validated, 12-house Bhavabala component aggregator.
- `server/engine/bhavabala.test.ts`: 12-house, zodiac-wrap, invalid cusp, provenance tests.
- `server/engine/shadbala.ts`: Shadbala component aggregator.
- `docs/SHADBALA-EXACT-SCORING-SPEC.md`: classical sixfold calculator specification.
- `docs/PLANET-ASPECT-HOUSE-ENERGY-READ-INTEGRATION.md`: cross-engine acceptance gates.

## Where to wire it
Simulation Lab: `server/engine/guardianEphemerisAdapter.ts` -> canonical chart snapshot -> Shadbala calculators -> Bhavabala calculators -> `server/engine/methodRegistry.ts` -> `server/engine/simulationAdapter.ts` -> result API/UI. Existing active prediction path still needs migration from old J2000 engine; reconcile other open PRs before merging.

The Absolute is a SEPARATE repo `kevinparksinc-maker/firmament-guardian`. After testing, port calculators and adapter to its chart calculation path, then integrate into `server/energyReadV2.ts` and energy-read API/UI. Do not assume a Simulation Lab branch updates The Absolute.

## Complete classical house formulas (not implemented yet)
For each of 12 houses calculate:
1. **Bhavadhipati Bala**: derive house lord from its canonical cusp/sign and traditional rulership. Use verified Shadbala strength of that lord. Document the traditional conversion/units and avoid multiplying by arbitrary sport weights.
2. **Bhava Dig Bala**: calculate directional house strength using a chosen classical Bhavabala method and exact cusp angles. Publish the formula, references and boundary examples; no house-number-only lookup.
3. **Bhava Drishti Bala**: calculate signed aspects received by each house, with traditional graha drishti fractions and benefic/malefic classifications. Document the classical tradition and avoid double counting Shadbala Drik Bala.
Total Bhavabala in virupas = sum of those three component values. No universal Shadbala-like minimum or probability is inferred from this sum.

## Frame and accuracy
Canonical Babylonian Aldebaran-anchored longitudes, no J2000, no obliquity, zero-tilt user model. Zodiac-forward equal house cusps: ASC + 30°*(house-1) modulo 360. Confirm whether a God View 'house' is a meaningful locally directed house: house power should be computed from an actual Agent View ascendant, and God View may display it as context rather than fabricate a second house chart.

## Release acceptance checklist
1. Implement verified classical three component calculators; add source/variant and subcomponent breakdown.
2. Validate chart geometry, exact event timestamp, house lords and 12 cusps.
3. Verify against independently computed worked examples and boundaries.
4. Add method registry evidence-only entry first; expose each house component, total and source.
5. Add experimental Energy Read V2 view with original score versus condition-adjusted score; retain baseline and avoid double counting.
6. Compare out-of-sample results; only promote to predictive scoring if validated.
7. Run tests, typecheck, build; verify live chart/API/UI. Merge to main only after review.

## Honest current state
This branch **does not yet calculate classical house-lord, directional or house-aspect component scores from raw chart data**. It aggregates validated inputs and rejects missing components. It is not yet connected to live API/UI, has not been test-run, and is not merged. Do not present it as fully deployed.
