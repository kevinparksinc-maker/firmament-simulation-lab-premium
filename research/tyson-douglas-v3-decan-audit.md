# Firmament — exact-degree Chaldean decan layer audit

**Version:** ZODIAC_FORWARD_HOUSE_1_TO_12_V3 · deliberately zero-tilt model · independent CORE_04 Chaldean Decans.

**Code and tested workflow:** `shared/firmamentDecans.ts`, `server/engine/chaldeanDecanCore.test.ts`, `server/engine/territorialStack.ts`; GitHub Actions [Daily studio validation run 39540340440](https://github.com/kevinparksinc-maker/firmament-simulation-lab-premium/actions/runs/39540340440).

## Grounded results

- All **36 fixed 10° faces** and the traditional **12×3 Chaldean rulers** are present. A face is computed from **absolute longitude modulo 30°**, **not** the body's `degreeInHouse` and not the house cusp sign.
- Valid boundaries: [0°,10°) first, [10°,20°) second, [20°,30°) third. At sign 30°, the next sign's first face begins. Inputs outside [0,30°) now **throw** rather than being clamped into a false first/third face.
- Face-to-house overlaps are calculated from the existing canonical `arcHouseOverlaps()` function; they preserve exact 10° total even when split between multiple houses.
- **Worked example:** ASC 25° Taurus, Taurus third face spans 20°–30° Taurus. It occupies **5° of House 12 and 5° of House 1**; both segments remain **Taurus face 3, Saturn-ruled**. Whole-sign shortcuts would incorrectly attribute all 10° to one house.
- The circular-wheel decan overlay previously showed only 36 tick marks; now marks each ruler abbreviation and exact sign-relative positions in the planet key. The diamond now offers an expandable all-body exact-degree/sign/face/ruler/house ledger. Its house symbols still mark **cusp signs only**, not a claim that the whole house lies in one sign.

## All twelve traditional Chaldean face rulerships

| Fixed sign | Face 1 [0°,10°) | Face 2 [10°,20°) | Face 3 [20°,30°) |
|---|---|---|---|
| Aries | Mars | Sun | Venus |
| Taurus | Mercury | Moon | Saturn |
| Gemini | Jupiter | Mars | Sun |
| Cancer | Venus | Mercury | Moon |
| Leo | Saturn | Jupiter | Mars |
| Virgo | Sun | Venus | Mercury |
| Libra | Moon | Saturn | Jupiter |
| Scorpio | Mars | Sun | Venus |
| Sagittarius | Mercury | Moon | Saturn |
| Capricorn | Jupiter | Mars | Sun |
| Aquarius | Venus | Mercury | Moon |
| Pisces | Saturn | Jupiter | Mars |

## V3 Tyson vs. Buster Douglas venue audit (all 12 bodies, unrounded for classification)

**Event:** February 11, 1990, ~12 p.m. JST (03:00 UTC), Tokyo Dome, 35.7056°N 139.7519°E. The exact first-bell time remains approximate.
**Ascendant:** 55.673652896°; **Tyson houses:** 1,2,3,6,10,11; **Douglas houses:** 4,5,7,8,9,12.

| Body | Fixed sign degree | Decan ruler | Agent equal house | House assignment |
|---|---|---|---:|---|
| Sun | Aquarius 24.621562° (abs 324.621562°) | face 3, Moon | H9 | Buster Douglas |
| Moon | Virgo 8.994061° (abs 158.994061°) | face 1, Sun | H4 | Buster Douglas |
| Mercury | Aquarius 1.173410° (abs 301.173410°) | face 1, Venus | H9 | Buster Douglas |
| Venus | Capricorn 21.807204° (abs 291.807204°) | face 3, Sun | H8 | Buster Douglas |
| Mars | Capricorn 10.056281° (abs 280.056281°) | face 2, Mars | H8 | Buster Douglas |
| Jupiter | Cancer 1.362768° (abs 91.362768°) | face 1, Venus | H2 | Mike Tyson |
| Saturn | Capricorn 22.102725° (abs 292.102725°) | face 3, Sun | H8 | Buster Douglas |
| Uranus | Capricorn 8.909685° (abs 278.909685°) | face 1, Jupiter | H8 | Buster Douglas |
| Neptune | Capricorn 14.710084° (abs 284.710084°) | face 2, Mars | H8 | Buster Douglas |
| Pluto | Scorpio 19.744755° (abs 229.744755°) | face 2, Sun | H6 | Mike Tyson |
| Rahu | Aquarius 16.280579° (abs 316.280579°) | face 2, Mercury | H9 | Buster Douglas |
| Ketu | Leo 16.280579° (abs 136.280579°) | face 2, Jupiter | H3 | Mike Tyson |

## Actual raw decan-method result, not a prediction certificate

| Frame | Tyson score | Douglas score |
|---|---:|---:|
| God View | 4.5 | -0.5 |
| Agent View | -0.5 | 4.5 |
| Arithmetic synthesis | 2 | 2 |

**Synthesis status:** EQUAL_SCORES. **Certification:** NOT_CERTIFIED. This is a **numerical tie**, *not* a prediction of a drawn fight. Do not call it a verified sporting method.

**Rule interpretation audit:** The CORE_04 implementation runs over all twelve bodies; it awards +1 if a body occupies the face it itself rules, then +0.5 if the decan ruler's **house family** matches the body's, otherwise −0.5. These ±0.5 family bonuses are **app-specific sports heuristics**, not the traditional Chaldean dignity table. House cusps, empty houses, and how a face intersects the six houses of each competitive family are **not independently scored**. This remains an outstanding methodological scope gap despite all twelve bodies being iterated.

**Coordinate caveat:** The incoming planetary angles are sourced from the app's custom zero-tilt projected wheel. A correct degree-to-face lookup does not independently certify its ephemeris frame or the validity of sports interpretation; treat both as separate prerequisites.

**Research safety:** Previous Tyson–Douglas tables using the reverse-numbered pre-V3 houses are archival and should never be mixed with this audit.
