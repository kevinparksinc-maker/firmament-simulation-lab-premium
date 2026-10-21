# Firmament 360° wheel — Chinese 28 Xiù, star-anchored J2000 layer

**Implementation status:** all 28 modern Stellarium Chinese Xiù determinative stars have a real source-catalog **J2000 right-ascension**. The 28 unequal boundaries now render as pink spokes on the **Home page circular Astrolabe**, and both diamond and circle views expose a full 28-mansion star identification catalog. Reference projected planetary RA-to-mansion labels are visible through an expandable ledger. This is a geometry/reference-data implementation, **not** validated prediction doctrine.

## Sources and frozen reference convention

- Name/order/HIP determinate-star set: Stellarium Chinese sky-culture contemporary HIP series: https://stellarium.org/doc/25.0/classStelSkyCultureSkyPartition.html
- **Actual J2000 RA positions**, in decimal degrees, from `starmap/data/stars.csv`, compiled from the Yale Bright Star Catalogue 5th Revised Edition, 1991, public domain: https://github.com/isene/starmap/blob/master/data/stars.csv
- Traditional pole-to-pole equatorial/right-ascension reference sectors of **unequal width**, not 360/28 equal sectors: https://fossies.org/linux/stellarium/skycultures/chinese/description.md
- Historical differences among Tang/Song/Ming/Qing determinative stars: https://kuangchujia.com/glossary/en/

**Fixed scientific scope:** these are J2000 equatorial RA reference positions, a modern source-defined sky projection. They are not asserted to be the traditional star choices for every historical Chinese epoch. Proper motion and precession are not dynamically applied to these fixed reference positions.

## Independent layers

Chinese Xiù coexists **without replacement** of the fixed zodiac signs (12×30°), exact-degree Equal Houses (ASC+n×30°), elemental-family decans (36×10°), 27 Vedic Nakshatras, 28 Arabic Manāzil, or the broader fixed-star catalog.

Four Chinese directional families (NOT the Western zodiac's four elements):
1. Azure Dragon — East — Wood — Jiao, Kang, Di, Fang, Xin, Wei, Ji
2. Black Tortoise — North — Water — Dou, Niu, Nu, Xu, Wei, Shi, Bi
3. White Tiger — West — Metal — Kui, Lou, Wei, Mao, Bi, Zi, Shen
4. Vermilion Bird — South — Fire — Jing, Gui, Liu, Xing, Zhang, Yi, Zhen

## Files changed / wired

- `shared/chineseMansions.ts`: catalog of all 28 star HIP IDs, names, quadrants, epoch/frame strict validation; actual measured-RA sorted uneven sectors, 360° total conservation, degree-to-Xiù resolver, optional house-sector intersections. Invalid/partial catalog data returns NOT_EVALUABLE, **never invented positions**.
- `shared/chineseMansionJ2000Stars.ts`: frozen real 28-star J2000 Yale-BSC-based HIP→RA coordinates, catalog provenance, reference sector list.
- `client/src/pages/Home.tsx`: actual live main circular Astrolabe draws all 28 unequal reference-star boundary spokes; planet-to-Xiù readout from original J2000 projected longitudes; zodiac, house and planet positions advance counterclockwise to match core V3.
- `client/src/components/ChineseMansionCatalog.tsx`: 28 names, glyphs, HIP source IDs, actual RA coordinates and quadrants displayed beside actual diamond and circle charts.
- `client/src/components/EventChartWheel.tsx`: separately available detailed wheel component defaults to actual J2000 28-star positions, displays them with names/epoch and rejects mismatched catalog inputs.
- `server/engine/chineseMansions.test.ts`: architecture contracts, invalid catalog guards and *explicitly synthetic* fixture.
- `server/engine/chineseMansionSourceCatalog.test.ts`: actual source catalog checks (Spica HIP65474 RA201.2983°, Antares HIP80763 RA247.3517°), unequal sectors, complete 360° and RA-to-house width conservation.

## Important limitations still outstanding

1. **Coordinate-frame matching**: The app's planet `backgroundWheelLongitude` is currently an equatorial J2000 RA-style projection, even if inaccurately named "ecliptic" in some engine fields. The eastern Ascendant uses the local apparent sidereal hour-angle *of date*. Before claiming historically accurate *event-local* Chinese mansion-to-house maps, align those reference epochs without changing the user's intentional zero-tilt convention.
2. **Zi/Shen**: historical order of determinate stars sometimes differs; sort their *actual reference RA* for the selected epoch and report swap warnings instead of forcing negative widths. One choice has now been anchored to J2000 only.
3. **Dynamical/historical options**: The current Chinese Xiù geometry is frozen J2000; historical traditional catalog variants and of-date stellar positions should be separate, opt-in versions if later researched.
4. **Sports methodology**: no new scoring, weights or AI predictions are added. Descriptive layer only until user requests and separately verifies Chinese-mansion doctrine and interpretive applications.

**Status:** source star references and main-chart geometry integrated on research draft PR #44; not deployed/merged to main. Retain all previous methods and overlays unchanged.
