# Firmament degree-to-house-to-mansion coordinate audit — October 20, 2026

**Scope:** Source-level audit with live unit-test output for Tyson–Douglas, Tokyo Dome 1990-02-11 at approximately 12:00 JST (03:00 UTC). **Code test:** `server/engine/coordinateLayersAudit.test.ts`. [CI run #39522892850](https://github.com/kevinparksinc-maker/firmament-simulation-lab-premium/actions/runs/39522892850). **Result:** both CI workflows successful; that proves code executes, not every astronomical interpretation is calibrated.

**Nonnegotiable user doctrine preserved:** Deliberate zero-tilt equatorial-reference research model; fixed Aries-origin 360° background; 30° equal houses numbered from 1 → 12 → ... → 2 as absolute longitude increases; Ascendant-side family H1/2/3/6/10/11; Descendant-side family H4/5/7/8/9/12; 5° desired relationship limit with 100/80/60/40 tier weights (cutoff bands still need an explicit design).

## Actual coordinate pipeline

1. UTC event time is passed to `Astronomy.SiderealTime` (Greenwich **apparent, of-date** sidereal time) and added to east-positive geographic longitude for local sidereal angle. Corrected zero-tilt east horizon anchor: `(GAST×15 + venue longitude + 90) modulo 360`. **Blocker:** GAST is of-date; planet vectors are J2000 (EQJ). A frame transform is not yet established, so apparent sidereal angle and EQJ planet angle may not share an epoch.
2. Planet vectors use `Astronomy.GeoVector` equatorial J2000, then `atan2(y,x)` to produce a wheel angle. This is **J2000 right ascension**, not standard tropical ecliptic longitude. Variables `tropicalLongitude`, `ofDateEclipticLongitude`, `fixedJ2000EclipticLongitude` are misleading names. No axial tilt needs adding just to properly identify the frame.
3. Rahu / Ketu use a standalone mean lunar node longitude equation `125.04452 − 0.0529538083×days` (Ketu is antipodal), applied directly to the same wheel without an explicit conversion. **Blocker:** these node angles are traditionally ecliptic and are not on the same documented EQJ basis as the ten major bodies.
4. God View: anchor 0°; Agent View: eastern Ascendant; body absolute longitude is unchanged between frames; only 30° house boundary relationship changes. House cusp uses `ascendant + ((13-house)%12)×30`. Positive zodiac-longitude order produces 1 → 12 → ... → 2. **PASS** for user-defined geometry.
5. Labels Aries–Pisces are assigned from consecutive 30° sections of the equatorial wheel. This is valid only as a documented custom zodiac-label mapping and must never be mistaken for independently computed actual ecliptic sun signs.
6. Chaldean decans: use sign-relative `absoluteLongitude % 30`, divide at 0°, 10°, 20°; ruler sequence as traditional faces for each labeled sign. **PASS for arithmetic/lookup**, but not yet verified against an independently anchored zodiac.
7. Nakshatras: 27 equal spans of 13°20′ (800 arcminutes); four padas of 3°20′. KP star lord and nine sub-lords divide each span proportionally to the 120-year Vimshottari sequence; KP249 splits sign-crossing subsegments. **PASS for subdivisions**, **NOT CALIBRATED** as standard sidereal/Nirayana Nakshatras because the equatorial wheel is used with zero ayanamsa.
8. Arabic Mansions: 28 equal spans of `360/28=12.857142857°` from absolute 0°, correct contiguous equal-Mansion scheme. `manzilFromLongitude` gives index, name, arc endpoints, middle degree, center orb; absolute sector assignment must remain fixed across God and Agent while mansion-to-house overlap changes. **PASS for equal tropical-style sectors**, **NOT CALIBRATED** as star/asterism anchored Manazil.
9. Fixed stars: `fullPackageDualFrameChallenger.ts` has hand-entered archive longitude values (Aldebaran 45°, Regulus 135°, Antares 225°, Fomalhaut 315°, Bellatrix 162°). In `firmamentEngine.ts`, the same royal stars have J2000 RA constants 68.98°,152.09°,247.35°,344.41°; calibration is set to zero. **CRITICAL**: archive scoring longitude is not its named star's documented J2000 RA, yet fixed-star layer compares planet wheel positions directly against these numbers. It checks within 1° rather than user's 5°, and only house-lord placements instead of all chart bodies.
10. All body horizontal angles (`azimuth`, `altitude`) are currently initialized as `{ azimuth:0, altitude:0 }`. **CRITICAL:** the Sun's altitude never becomes negative, so Arabic Lots always use day formula, even for night games. Placeholder azimuth/altitude must not be labeled measured astronomy.
11. `celestialGeometry.ts` does use 5° but weights 5/4/3/2/1 at bands instead of requested percent labels 100/80/60/40; `Arabic mansion context` is a same-mansion pair heuristic with continuous `(1−orb/5)` weights, not an independently established traditional moon-mansion doctrine. Orb and scoring policy differ across layers.
12. Game Venue fallback `resolveVenue` uses hash to invent coordinates for unmatched location strings. This should be disallowed for any exact house or astronomical validity certification.

## Actual twelve house boundaries from the corrected eastern Ascendant (55.673653°)

| House | Team | Cuspal zodiac label | Occupants |
|---|---|---|---|
| 1 | Mike Tyson | Taurus 25.674° | — |
| 12 | Buster Douglas | Gemini 25.674° | Jupiter |
| 11 | Mike Tyson | Cancer 25.674° | Ketu |
| 10 | Mike Tyson | Leo 25.674° | Moon |
| 9 | Buster Douglas | Virgo 25.674° | — |
| 8 | Buster Douglas | Libra 25.674° | Pluto |
| 7 | Buster Douglas | Scorpio 25.674° | — |
| 6 | Mike Tyson | Sagittarius 25.674° | Venus, Mars, Saturn, Uranus, Neptune |
| 5 | Buster Douglas | Capricorn 25.674° | Sun, Mercury, Rahu |
| 4 | Buster Douglas | Aquarius 25.674° | — |
| 3 | Mike Tyson | Pisces 25.674° | — |
| 2 | Mike Tyson | Aries 25.674° | — |

## Actual twelve body-to-layer results (on engine's custom equatorial-labeled wheel)

| Body | Competitive house | Absolute 360° | Zodiac label | Chaldean decan ruler | Nakshatra / pada / sublord | Arabic mansion |
|---|---:|---:|---|---|---|---|
| Sun | H5 (Buster Douglas) | 324.622° | Aquarius 24.622° | Face 3: Moon | #25 Purva Bhadrapada, Pada 2, Sub Mercury | #26 Al-Fargh al-Muqaddam |
| Moon | H10 (Mike Tyson) | 158.994° | Virgo 8.994° | Face 1: Sun | #12 Uttara Phalguni, Pada 4, Sub Venus | #13 Al-Awwa |
| Mercury | H5 (Buster Douglas) | 301.173° | Aquarius 1.173° | Face 1: Venus | #23 Dhanishta, Pada 3, Sub Mercury | #24 Sa'd al-Su'ud |
| Venus | H6 (Mike Tyson) | 291.807° | Capricorn 21.807° | Face 3: Sun | #22 Shravana, Pada 4, Sub Venus | #23 Sa'd Bula |
| Mars | H6 (Mike Tyson) | 280.056° | Capricorn 10.056° | Face 2: Mars | #22 Shravana, Pada 1, Sub Moon | #22 Sa'd al-Dhabih |
| Jupiter | H12 (Buster Douglas) | 91.363° | Cancer 1.363° | Face 1: Venus | #7 Punarvasu, Pada 4, Sub Rahu | #8 Al-Nathra |
| Saturn | H6 (Mike Tyson) | 292.103° | Capricorn 22.103° | Face 3: Sun | #22 Shravana, Pada 4, Sub Venus | #23 Sa'd Bula |
| Uranus | H6 (Mike Tyson) | 278.910° | Capricorn 8.910° | Face 1: Jupiter | #21 Uttara Ashadha, Pada 4, Sub Venus | #22 Sa'd al-Dhabih |
| Neptune | H6 (Mike Tyson) | 284.710° | Capricorn 14.710° | Face 2: Mars | #22 Shravana, Pada 2, Sub Jupiter | #23 Sa'd Bula |
| Pluto | H8 (Buster Douglas) | 229.745° | Scorpio 19.745° | Face 2: Sun | #18 Jyeshtha, Pada 1, Sub Venus | #18 Al-Qalb |
| Rahu | H5 (Buster Douglas) | 316.281° | Aquarius 16.281° | Face 2: Mercury | #24 Shatabhisha, Pada 3, Sub Venus | #25 Sa'd al-Akhbiyah |
| Ketu | H11 (Mike Tyson) | 136.281° | Leo 16.281° | Face 2: Jupiter | #11 Purva Phalguni, Pada 1, Sub Moon | #11 Al-Zubrah |

### Worked example (Mars)

Engine places Mars at **280.056281°** = **Capricorn 10.056281°** on its research wheel; that makes it Capricorn's **second Chaldean decan (Mars ruled)**, **22nd Nakshatra Shravana/Pada 1**, **22nd Arabic manzil Sa'd al-Dhabih**, and **House 6** because the corrected Agent H6 starts at Sagittarius 25.673653° (265.673653° absolute) and ends at Capricorn 25.673653° (295.673653°). Its house-cusp sign does not need to match its planet sign.

## Actions before certifying methods

**P0**  Decide and enforce one time/epoch coordinate contract (EQJ RA vs of-date apparent local horizon); do not change zero tilt. Resolve the node mapping. Calculate true observer horizon angles from the intended model; replace hardcoded altitude/azimuth. Require real coordinates in event fixtures. Fix star catalog to a single declared epoch/reference rather than stylized lookup longitudes.
**P1** Document the zero-titled mansion/nakshatra mapping as custom, or use consistent sidereal/asterism input projection for genuine classical doctrine; the names do not become classical sky positions merely by assigning a 0°-Aries offset. Enforce user's 5° orb and discrete weight mapping across applicable methods.
**P2** Rebuild full raw line-by-line method tests with degree, sign, decan, KP subdivisions, Arabic Manzil, fixed-star proximity and 12-house aspect inventory, and independently supplied test fixtures. Show exact formula and input provenance per method. Quarantine unsound methods until corrected.

**This audit does not certify sports prediction.** Keep legacy evidence isolated from model version V2 and keep PR #44 as a draft until the high-priority data errors are resolved.
