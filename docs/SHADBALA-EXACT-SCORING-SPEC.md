# Shadbala scoring — executable implementation contract

## Total and normalization
All six component totals are in virupas (shashtiamsas). 60 virupas = 1 rupa.
TOTAL = STHANA + DIG + KALA + CHESHTA + NAISARGIKA + DRIK.
RATIO = TOTAL / requiredVirupas[planet]; percentage = 100*RATIO.
Traditional minimum virupas: Sun 390; Moon 360; Mars 300; Mercury 420; Jupiter 390; Venus 330; Saturn 300.
These are **strength relative to traditional minimum**, not win probabilities. Drik can be negative. Do not clamp the overall result to 0–100%.

## Sthana Bala (positional)
Implement as sum of:
- Uchcha Bala: 60 * (shortest zodiacal angular separation from exact debilitation degree / 180). At debilitation 0; at exact exaltation 60. Use wrap-safe shortest distance in [0,180].
- Saptavargaja Bala: calculate traditional dignity grades in D1, D2, D3, D7, D9, D12, D30 (seven vargas), with classical per-varga relationship scores. Define source-specific score tables explicitly and fixture-test each.
- Ojayugma Rasyamsa Bala: odd/even sign and navamsa placements, according to planet-specific classical rules.
- Kendradi Bala: angular/succedent/cadent house-position strength under documented classical rules.
- Drekkana Bala: planet-specific decan strength.
Record each subscore and the exact source/tradition used; do not silently substitute the app's elemental-family decans for classical Shadbala Drekkana rules.

## Dig Bala (directional)
Traditional full strength 60 at directional best angle, zero at opposite weakest angle; scale by shortest angular distance from weakest angle / 180 * 60. Traditional strongest: Sun/Mars 10th, Moon/Venus 4th, Mercury/Jupiter 1st, Saturn 7th. Calculate with verified house angles and degree-accurate cusp geometry, not merely house number. In the user's custom zero-tilt framework, test whether this is an adapted formula and label it as such.

## Kala Bala (temporal)
Implement and expose the classical sub-balās: Natonnata (day/night), Paksha (lunar phase), Tribhaga (day/night thirds), Abda/Masa/Vara/Hora rulers, Ayana (solar declination/seasonal strength), Yuddha (planetary war when applicable). The full classical formula depends on exact sunrise/sunset, planetary hour and astronomical geometry; **Ayana Bala requires an explicit adaptation decision under zero obliquity**. No arbitrary fallback values.

## Cheshta Bala (motional)
Calculate classical motion strength from validated ephemeris instantaneous longitudes and velocities, station/retrograde classification and applicable planetary-specific rules. Do not assume retrograde always equals a flat fixed bonus. Traditional handling of Sun/Moon differs from the other five; document and test.

## Naisargika Bala (natural, fixed)
Sun 60; Moon 51.43; Venus 42.86; Jupiter 34.29; Mercury 25.71; Mars 17.14; Saturn 8.57 virupas. Keep full precision internally where possible; rounding only at display.

## Drik Bala (aspectual)
Compute classical graha drishti contributions from all seven planets with planet-specific special aspects (Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th, all 7th) and the documented partial-aspect strength rules. Weight by the classical benefic/malefic condition, including waxing/waning Moon and conditional Mercury. Retain signed total and inspect potential negative contribution. Do not substitute Western conjunction/trine/square weights.

## Hard requirements
1. Use the same canonical Aldebaran-anchored longitude and exact chart time for all six components; do not mix J2000, tropical, Lahiri, and the custom fixed frame in one Shadbala score.
2. Compute verified values for each of seven classical planets. Preserve raw six values, subvalues, required minimum, ratio, and source provenance.
3. For God View, note that Dig Bala and other observer-specific quantities may require an Agent View location; do not manufacture a second local directional result. Keep the same physical planet strengths across views unless there is a doctrinal reason for a frame-specific component.
4. Never conflate strength with beneficence, team association or sports prediction. Compare baseline, Shadbala-only, baseline+Shadbala, and Western-dignity-added models on out-of-sample historical fixtures.
5. Until every component has a source-checked calculation and tests, mark the module evidence-only and refuse a full classical Shadbala result if any required value is absent.
6. Unit tests: exact exaltation/debilitation, wrap 359°→0°, Dig angular extremes, Moon phases, retrograde/station, signed Drik, all natural values and minimum thresholds, timezone/sunrise, missing-input failures. Benchmark against independent classical worked examples. Run repository tests and typecheck before merge.

## Current branch status
`server/engine/shadbala.ts` is a strict six-component aggregator; it DOES NOT yet derive Sthana/Dig/Kala/Cheshta/Naisargika/Drik from a chart. This specification is the implementation handoff. The complete classical calculators, canonical ephemeris integration, active UI/API wiring, and empirical validation remain unfinished.
