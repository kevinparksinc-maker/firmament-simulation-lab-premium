# The Absolute → Simulation Lab Premium: canonical chart parity handoff

## Purpose
Make Simulation Lab Premium calculate AND render the identical canonical star map and chart data as The Absolute. This branch is an implementation handoff, **not** proof of completed integration. Never merge without parity tests.

## Current verified state
- `server/engine/guardianEphemerisAdapter.ts` validates a provider-supplied mode-14 longitude and adds overlays. It does **not** calculate Swiss Ephemeris positions.
- `package.json` still depends on `astronomy-engine`.
- Existing adapter tests validate a mocked position, not real end-to-end parity.

## Required implementation
1. Identify The Absolute's actual production chart provider and extract its authoritative calculation contract. Share code through a versioned package or invoke a single canonical service; do not independently approximate its longitude transformation.
2. Use Swiss Ephemeris sidereal mode 14 and the exact configured Aldebaran-at-15°-Taurus transformation used by The Absolute. Do not introduce J2000 normalization, precession correction, obliquity, or axial tilt into the custom chart framework. Document where astronomical raw inputs end and the app-specific zero-tilt geometry begins.
3. Derive God View and Agent View from the SAME canonical longitudes. Agent View must use The Absolute's custom ascendant solver and degree-precise Equal House cusps, 30° increments. Ensure ASC/DSC not inverted.
4. Overlay fixed stars, 27 Nakshatras, 28 Arabic Manzils, Chinese mansions, and elemental-family decans from the same normalized 0–360° longitude. Never substitute houses for zodiac-degree mansion indexing. Show fixed stars even without an aspect.
5. Feed the same immutable chart payload to maps, labels, sports methods, API responses, and exports. Include `referenceFrame`, provider version, date/timezone, location, longitudes, ascendant, house cusps, and overlays. Fail closed on missing or mismatched provider data; never silently fall back to `astronomy-engine`.
6. Ensure chart UI and diamond chart agree with The Absolute (houses counterclockwise, zodiac signs Aries→Pisces, planets clockwise in the user's layout). Verify event-location/time conversions.
7. Trace and replace ALL active legacy calculation entry points in single-game, batch, historical replay, and 31-method paths; remove or quarantine old dependencies only after all callers migrate.

## Required tests and acceptance gates
- Golden fixture from The Absolute: 1986-11-20 10:06 AM CST, Dallas TX, including longitudes and zero-tilt ascendant; compare exact canonical output with explicit numerical tolerance.
- Test several event timestamps, time zones, DST transitions, longitudes, and ASC boundary cases.
- Verify Aldebaran longitude=45° and fixed-star overlay, and reject wrong source/referenceFrame.
- Snapshot chart map, God/Agent house assignments, fixed stars, and each mansion/decans overlay against The Absolute.
- Confirm each of 31 methods receives the canonical chart and that no active legacy path remains.
- Run `npm run check`, `npm test`, single-game and 200-game smoke tests. Record results in PR; no fabricated pass claims.
- Merge tested code to `main` after review; do not deploy or publish as part of this handoff.

## Instructions for Manus / Google AI Studio
Implement this branch in place. Start by tracing the authoritative provider in The Absolute and all Premium call sites. Commit working changes to this branch, include a parity report and failing/passing tests, then request review before merging into main. Do not treat the adapter's mock test as proof of chart parity.
