# Manus implementation handoff — zodiac-forward Equal Houses

## Confirmed defect on main
`server/engine/houseFrameFoundation.ts` used reverse zodiac indexing: God H1 Aries, H2 Pisces, H3 Aquarius, H12 Taurus. This conflicts with the approved convention: H1 Aries, H2 Taurus, H3 Gemini, H12 Pisces. For Agent View, H1 begins at the exact Ascendant longitude and subsequent 30° house cusps move forward in longitude.

## Code already committed on this branch
- `houseCusp`: anchor + (house - 1) * 30
- `locateInHouse`: floor(relative / 30) + 1
- `endLongitude`: cusp of next house, wrapping H12 to H1
- `arcHouseOverlaps`: map zodiac-forward segment h to house h + 1
- God View anchor remains 0° Aries; Agent View anchor remains the computed Ascendant; no ephemeris or ascendant calculation has been changed.

## Manus: required integration work
1. Review this focused diff against `main` and draft PR #44; avoid overwriting the correction with older reverse-house branches/PRs.
2. Search the ENTIRE repository for reverse-index formulas (`13 - house`, `13 - segment`, `13 - h`, `12 - index`, descending house loops), manually assigned house labels, house-ruler mappings, 1/7 team sides, God/Agent/Synthesis scoring, chart renderers, aspect attribution, decan/mansion house overlays and saved historical evidence. Change only code that actually encodes reverse zodiac house numbering; do not blindly replace legitimate reverse iteration.
3. Add Vitest tests:
   - God: 0° Aries => H1; 30° Taurus => H2; 60° Gemini => H3; 330° Pisces => H12.
   - Agent Asc 285° (Capricorn 15°): 285° H1; 315° H2; 345° H3; 255° H12; boundary checks ±epsilon and 359° wrap.
   - All 12 cusps distinct, 30° apart, forward, correct `startLongitude`, `endLongitude`, `degreeInHouse`.
   - `arcHouseOverlaps` for 30° arcs, cusp-crossing arcs, 360° wrap and summed overlap length.
   - Same longitude and Ascendant produce coherent God/Agent assignments throughout method scoring and UI.
4. Compare to The Absolute's ACTIVE canonical coordinate and house implementation. Keep Aldebaran anchor, zero-tilt Ascendant, Equal House and zodiac-forward numbering consistent; no J2000/precession/obliquity substitutions.
5. Run `npm run check`, `npm test`, `npm run build`; record exact outcomes and fix failures. These checks have NOT been run by ChatGPT.
6. Assess migration: invalidate or version prior saved simulations computed under reverse-house convention. Do not silently mix old/new outcomes in 100,000-game evaluation.
7. Reconcile draft PR #44 and other conflicting house-direction changes; merge the validated final correction into `main` only after review, tests and conflict resolution.

## Acceptance criteria
- All God and Agent equal-house mappings advance in zodiac longitude, with correct degree-level boundaries.
- No downstream scoring or visualization still uses reverse mapping.
- All tests/check/build pass, and the result is merged to `main`.
- Historical outputs are tagged by calculation version and not silently combined.

## Next audit area
After this handoff: trace active ephemeris provider -> Aldebaran calibration -> planet longitudes -> Ascendant -> God/Agent chart API -> 31 scoring methods. Compare live paths to The Absolute, not commit titles. Inspect epoch/frame conversions, lunar nodes, fixed stars and mansion catalogue boundaries. Document each mismatch with file, function, proposed patch and test before the 100,000-game run.
