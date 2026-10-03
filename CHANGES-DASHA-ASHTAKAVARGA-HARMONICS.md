# Dasha / Ashtakavarga / Harmonics upgrade

## Ashtakavarga
- Replaced the seven-planet house-distance approximation with classical sign-based Bhinnashtakavarga.
- Added Lagna as the eighth reference point.
- Excluded Rahu/Ketu from the classical BAV reference set.
- Added the standard contribution tables.
- Added chart-independent regression checks: 48/49/39/54/56/52/39 and SAV checksum 337.
- Preserved the existing A/B house-family overlay as a separate experimental projection.

## Vimshottari Dasha
- Added `calculateVimshottariDasha()` for natal Mahadasha, Antardasha, and Pratyantardasha.
- Computes first-period balance from the Moon's progress through its Nakshatra.
- Uses the fixed 120-year Vimshottari sequence.
- Added optional `DashaNatalContext` to `calculateDashaLayer()` and `calculateExperimentalLayers()`.
- Existing event-only callers remain compatible and receive an explicitly labeled event-time fallback.

## Harmonics
- Replaced the universal 6° H2-H12 orb with harmonic-specific defaults:
  H2 6°, H3 5°, H4 4°, H5 3.5°, H6 3°, H7 2.75°, H8 2.5°, H9 2.25°, H10 2°, H11 1.75°, H12 1.5°.
- This is a research calibration control, not a claim of empirically optimal or predictive orb values.

## Validation
- The edited experimental layer compiles against a local TypeScript stub of the engine dependencies.
- The BAV implementation was runtime-checked against the classical row checksums and 337-point SAV checksum.
- The Vimshottari implementation was runtime-checked for Nakshatra selection, starting lord, balance, and nested period levels.
- Full project test execution was not possible in this environment because the repository dependencies were not installed; `npm ci` timed out before completion.
