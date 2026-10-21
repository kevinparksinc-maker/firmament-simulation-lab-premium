> **ARCHIVED BEFORE CANONICAL V3 WHEEL (NOT CURRENT HOUSE GEOMETRY).** This record used the superseded H1→H12→H11 house progression. On the V3 wheel Pisces is behind Aries in House 12, Taurus is ahead in House 2, and all figures below must be recomputed using `ZODIAC_FORWARD_HOUSE_1_TO_12_V3`. See [the current wheel contract](../CORE-360-WHEEL-V3.md). Do not present the old planets-in-house ledger or game scores as current results.

# Tyson–Douglas — Territorial foundation: corrected Agent View chart

**Source:** Actual `runSingleMethodEvent(fixture,"CORE_01").agent.chart` output recorded by `server/engine/tokyoHouseMap.test.ts` and validated in [GitHub Action #39521513775](https://github.com/kevinparksinc-maker/firmament-simulation-lab-premium/actions/runs/39521513775).

- **Fixture:** Tokyo Dome, Bunkyo, Tokyo, Japan; 35.7056°N, 139.7519°E.
- **Timestamp assumed:** February 11, 1990, 12:00 JST = 03:00 UTC. Exact first-bell time not independently established.
- **Model:** deliberately zero tilt; positions are from equatorial J2000-derived angles *labeled as zodiac sectors by this engine*, **not independently verified standard tropical longitudes**.
- **Rising eastern Ascendant:** 55.673653° = Taurus 25°40′.
- **Descendant:** 235.673653° = Scorpio 25°40′.
- **House numbering:** Sign longitude advances counterclockwise; houses count 1, 12, 11, ..., 2, in 30° equal segments.
- **Tyson's houses:** H1 H2 H3 H6 H10 H11. **Douglas's houses:** H4 H5 H7 H8 H9 H12.

## 12 houses beginning at the exact Ascendant

| House | Cusp zodiac | Team | Planets and exact zodiac coordinates |
|---|---|---|---|
| H1 | Taurus 25°40′ | Mike Tyson | Empty |
| H12 | Gemini 25°40′ | Buster Douglas | Jupiter at Cancer 1°22′ (91.362768° absolute) |
| H11 | Cancer 25°40′ | Mike Tyson | Ketu at Leo 16°17′ (136.280579°) |
| H10 | Leo 25°40′ | Mike Tyson | Moon at Virgo 9°00′ (158.994061°) |
| H9 | Virgo 25°40′ | Buster Douglas | Empty |
| H8 | Libra 25°40′ | Buster Douglas | Pluto at Scorpio 19°45′ (229.744755°) |
| H7 | Scorpio 25°40′ | Buster Douglas | Empty |
| H6 | Sagittarius 25°40′ | Mike Tyson | Uranus at Capricorn 8°55′ (278.909685°); Mars at Capricorn 10°03′ (280.056281°); Neptune at Capricorn 14°43′ (284.710084°); Venus at Capricorn 21°48′ (291.807204°); Saturn at Capricorn 22°06′ (292.102725°) |
| H5 | Capricorn 25°40′ | Buster Douglas | Mercury at Aquarius 1°10′ (301.173410°); Rahu at Aquarius 16°17′ (316.280579°); Sun at Aquarius 24°37′ (324.621562°) |
| H4 | Aquarius 25°40′ | Buster Douglas | Empty |
| H3 | Pisces 25°40′ | Mike Tyson | Empty |
| H2 | Aries 25°40′ | Mike Tyson | Empty |

**Count:** 12 bodies total (seven in Tyson's house family, five in Douglas's). This is **not** a score; a scoring method must evaluate relevant house rulers, dignity, aspects, weights, missing contacts, and any appropriate doctrine.

## Validation cautions

1. All 12 bodies were sourced from the engine's corrected **Agent View** chart. God View is a separate fixed 0° wheel and not the venue chart.
2. The house signs are cusp signs, not exclusive signs. H1 Taurus 25°40′ through Gemini 25°40′; thus a planet at Gemini 20° belongs to H1 rather than H12.
3. The app's deliberate zero-tilt equatorial projected longitudes are not interchangeable with conventional ecliptic longitudes. Further coordinate-frame validation remains outstanding.
4. Precise first-bell time matters: 09:00 JST rather than the current approximate 12:00 JST would produce a different rising Ascendant and different houses. Never mix results from the two times.
