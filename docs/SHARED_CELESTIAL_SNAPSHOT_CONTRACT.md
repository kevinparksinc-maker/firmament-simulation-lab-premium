# Firmament shared snapshot contract — implementation status

All traditional methods must read the SAME completed chart for a single event timestamp and reference frame.

## Coordinate contract

- Planetary longitude remains an absolute 0° Aries-origin ephemeris measurement.
- God View: 12 equal houses starting at 0° Aries.
- Agent View: 12 equal houses starting at the event Ascendant; the planet's longitude itself does NOT change.
- All house cusps, positions, decan and mansion/house intersections derive from shared code in `houseFrameFoundation.ts`.
- Supported chart bodies include Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Rahu and Ketu.
- Lunar mansions and nakshatras describe EVERY chart body, not only the Moon. All twelve houses are included, not only a significator subset.
- God/Agent family sides: A H1/H2/H3/H6/H10/H11; B H4/H5/H7/H8/H9/H12.

## Lifecycle

1. Calculate ephemeris for ONE event time.
2. Calculate the shared degrees and frame-specific placements ONCE.
3. Freeze the method chart snapshot for each frame.
4. Run individual methods against that frame snapshot, independently, without mutating placements or rescheduling time.
5. Aggregate evidence and interpret it.
6. A distinct simulation controller may request other event timestamps; a traditional method may not.

Registered methods now have a snapshot entry point: `buildMethodChartSnapshot` → `runRegisteredMethodsFromSnapshot`.

## FPRE placement

FPRE certified pattern discovery must run **downstream** of saved method outputs. The user's FPRE V3 catalog code is a separate research module; it is NOT yet incorporated in this PR. Do not claim the catalog is deployed or producing validated predictive rules. Certification requires historical fixtures, market-calibrated reference probabilities, leakage checks, and replication testing.

## Merge blockers

- Run `npm run check` and `npm test` in the repository CI; not run by this GitHub connector.
- Ensure all 21 frame-synthesis methods, not just registered experimental methods, use the same immutable snapshot contract.
- Audit full chart family and outer-planet effects on scoring (not just the source-planet set and narratives).
- Verify tropical/of-date coordinate identity across ephemeris, angles and house cusps.
- Review FPRE's input fingerprinting and permutation dependency assumptions.
- Compare historical game simulations before/after this change before merging to main.
