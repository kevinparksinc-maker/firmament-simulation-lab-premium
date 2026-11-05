# Manus implementation handoff — Shadbala (sixfold planetary strength)

## Delivered code
`server/engine/shadbala.ts`: seven classical planets; six named components; virupa/rupa totals; planet-specific required thresholds; signed Drik Bala; separate God/Agent result and input provenance. `server/engine/shadbala.test.ts`: unit tests for sums, thresholds, input rejection and dual view.

## Critical boundary
This is a **six-component aggregator**, not yet a fully calculated classical Shadbala engine. It intentionally requires verified component values; never substitute arbitrary 0s or sport-specific weights and label them classical. `scoringEligible:false` prevents unverified inputs from becoming winner votes.

## Implement each classical component before activation
1. Sthana Bala: Uchcha, Saptavargaja, Ojayugma, Kendradi, Drekkana; calculate from canonical zodiac longitudes, traditional rulership, exaltation and divisional sign tables. Record each subcomponent.
2. Dig Bala: angular directional strength from exact equal-house angles and each planet's directional reference. Confirm zero-tilt Agent View geometry and whether God View has meaningful local angles; do not pretend they are identical.
3. Kala Bala: Natonnata, Paksha, Tribhaga, Abda/Masa/Vara/Hora, Ayana, Yuddha where applicable; record required sunrise, time, and solar geometry. Ayana calculations in particular require an explicitly reviewed adaptation because this app prohibits axial tilt.
4. Cheshta Bala: classical planetary speed/retrograde state and applicable Sun/Moon treatment; requires validated ephemeris velocities, not zodiac sign alone.
5. Naisargika Bala: fixed traditional values for the seven classical planets, with source and rounding policy.
6. Drik Bala: classical graha drishti aspectual contributions, benefic/malefic classification and signed values; do not reuse Western aspect weights as if they were Vedic Drik Bala.

## Sports integration
- Do not replace natural sports relevance with Shadbala. Shadbala strength is **not** favorability, a win probability or an automatic side vote.
- Determine side association using canonical equal houses: ASC 1,2,3,6,10,11 vs DSC 4,5,7,8,9,12. Evaluate benefic/malefic and functional roles separately.
- Keep Western dignity diagnostics distinct; don't double-count shared essential dignity components.
- Show six component scores, subcomponents, total, ratio, traditional minimum, God/Agent differences and exact calculation provenance in the UI.
- Register as `EVIDENCE_ONLY` until six verified calculators, chart parity, golden fixtures and blind validation are completed; then propose a separately versioned predictive sports method if supported.
- Existing 31-method reconciliation is pending; do not silently add an extra vote.

## Verification
Create independently checked classical examples, fixed-frame edge cases (0°/30°/360°), timezones, retrograde, angular boundaries, aspect sign and invalid input tests. Run `npm run check`, `npm test`, `npm run build`. Compare the same planetary inputs with independently calculated Shadbala reference outputs, documenting expected differences due to custom geometry.

## Status
Aggregator, tests and handoff committed in branch. Not connected to active simulation API/UI. Six component calculators not implemented. Tests not run; not merged.
