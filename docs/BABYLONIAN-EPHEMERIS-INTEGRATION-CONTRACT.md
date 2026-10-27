# Babylonian fixed-star / ephemeris integration contract

Target: Simulation Lab Premium (main). Companion: firmament-guardian (main).

## Existing implementation audit (2026-10-27)
- `server/engine/firmamentEngine.ts` already computes with `astronomy-engine` and exposes of-date ecliptic, J2000 RA/Dec, fixed-wheel, and local observer fields. Do not replace ephemeris positions with fixed star coordinates.
- `FIRMAMENT_CONSTANTS` currently defines a zero-obliquity custom wheel and Royal Star targets. The values are application conventions, not independently verified Babylonian catalog measurements.
- `server/engine/chineseMansions.ts` requires a complete sourced ICRS/J2000 determinative-star catalog. Missing catalog data must remain explicitly unavailable; no invented equal-width mansion positions.
- `server/engine/simulationAdapter.ts` consumes fixed-J2000 predictions, local predictions, and registered methods. Preserve existing score and blind-test paths.

## Required integration
1. Version a single star-catalog dataset with identifiers, source, epoch, coordinate frame, and longitude/RA/Dec; record any historical Babylonian attributions separately from modern coordinates.
2. Define named transforms: ephemeris of-date -> J2000 -> custom fixed wheel, and separate observer-local geometry. Do not silently mix RA and ecliptic longitude or call custom zero obliquity a measured Earth orientation.
3. Keep God View and Agent View independent; Agent View uses local event latitude, longitude and timestamp, with 30-degree Equal Houses anchored at the calculated Ascendant.
4. Bind 27 Nakshatras, 28 Arabic Manzils, 28 Chinese mansions and Elemental Family Decans to documented coordinate inputs. Chinese mansions use determinative-star RA boundaries; no equal-arc fallback.
5. Use the same versioned calculation package and reference fixtures in Firmament Guardian and Simulation Lab Premium. Compare planetary degrees, sign, house, mansion, star, and aspects for identical inputs.
6. Maintain a frozen, outcome-blind event dataset and report each registered method's God, Agent, synthesis, score, abstention/unavailable reason, and hit/miss after prediction is locked.
7. Run existing unit/integration tests and historical fixture tests before changing production prediction weights.

## Acceptance gates
- Identical timestamp and location yield identical shared-coordinate outputs in both applications (within documented numeric tolerance).
- Fixed stars remain queryable independent of conjunction/aspect orbs.
- All catalog gaps are visible, never silently fabricated.
- No method loses registration or changes weighting without a separate documented experiment.
- Merge to primary branch only after automated tests pass.

Status: implementation contract committed; cross-repository wiring and validation remain pending.
