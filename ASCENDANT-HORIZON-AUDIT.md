# Zero-tilt Ascendant correction: controlled V2 audit

## Firmament doctrine retained

The application deliberately uses a **zero-obliquity equatorial 360° background**. No standard Earth axial tilt is introduced by this correction. God View retains its permanent 0° reference and 12 reverse-numbered houses. Agent View continues to anchor its moving 12 equal houses at the event's local rising horizon. Favorite remains team A / the Ascendant side. House families stay:

- A: H1, H2, H3, H6, H10, H11.
- B: H4, H5, H7, H8, H9, H12.

## Root cause verified

`calculateAscendantLongitude()` previously returned `(GST × 15 + east-positive-longitude + 270°) mod 360°`. In the **zero-tilt equatorial model**, a locally rising point is on the *eastern* horizon with hour angle **−90°**. Hour angle = LST − right-ascension, so `RA(rising) = LST + 90°`. The prior `+270°` was the **western setting horizon** with hour angle +90°.

The corrected research-branch function returns `LST+90°`. `calculateLegacyWestHorizonLongitude()` deliberately preserves `LST+270°` for reproducing pre-fix geometry. The explicit version marker is `ZERO_TILT_EASTERN_HORIZON_V2`.

**Impact:** The old Agent anchor was exactly 180° away from the rising horizon. Because the user's reverse-numbered 12-house families are also exactly opposite, a 180° shift swaps the planet's A/B house family. This does **not** imply that all scoring routines' results merely reverse: rulership, dignity, cusp KP and multi-signal methods may change nonlinearly. Fixed-wheel God View remains 0°. The intentional 180° Opposition Shadow remains a separate user-requested transform, not an error-compensation toggle.

## Tests

`server/engine/ascendantHorizon.test.ts` verifies:
1. East rising hour angle −90°, west setting +90°, exactly 180° separation.
2. Intentional latitude independence (zero tilt) and 30° longitude offset law.
3. 12-house mapping and swap of A/B families from legacy geometry.
4. Correct moving Agent anchor and unchanged fixed God anchor for the actual run.

`server/engine/pipelineCoherence.test.ts` continues to compare full and isolated 31-method frames for the **same corrected** geometry; parity alone is not evidence of independent physical validity.

## Release and research safety

1. Merge only after CI and staging smoke tests; this is not yet deployed.
2. Invalidate all pre-V2 **Agent View** historical scorecards and sportsbook-accuracy aggregates; do not silently mix legacy and corrected runs. Historical input game records and fixed God View observations can remain available.
3. Run original fixtures again under V2, compare per-method raw A/B ledgers to legacy outputs, and then start a new sourced 200-game pilot. Treat 10,000-game conclusions as prospective research, not certified predictive power.
4. Audit coordinate nomenclature: `Astronomy.GeoVector` yields equatorial J2000 vectors, whose XY angle currently drives the zero-tilt background. Labels calling that a conventional **of-date ecliptic/tropical longitude** are incorrect. The proper fix is to consistently document frame and epoch, **not** to introduce obliquity into the deliberately zero-tilt model.
5. `resolveVenue` currently invents coordinates for unknown venue names. Require verified coordinates in historical research before claiming venue-calibrated results.
6. Dawn-anchored Agent Mode (Sun plus 1° per four minutes after supplied sunrise) is a distinct **approximation**, not automatically the same as the sidereal eastern-horizon model. Audit both explicitly; do not mix their statistical records.

### No silent history rewrite
The Git commit immediately before this correction can reconstruct original pre-V2 calculations. The current branch retains a named legacy west-horizon function as a control. New independent studies should label their Ascendant model and calculation version.
