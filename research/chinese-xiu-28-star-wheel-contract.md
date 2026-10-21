# Chinese 28 Lunar Mansions — star-anchored 360° wheel foundation (research draft)

**Current status: reference catalog and safe overlay plumbing wired. REAL RA CALIBRATION STILL OUTSTANDING.** Do not claim the main chart displays verified mansion boundaries or computes real mansion placements until the 28-star right ascension catalog and a common epoch are explicitly supplied.

## Astronomical foundation

Unlike Arabic Manazil or 27 equal Nakshatra sectors in this app, Chinese 28 Xiù are **unequal** sky sectors measured in **equatorial right ascension** between determinative stars (距星). Four groups of seven: East Azure Dragon/Wood, North Black Tortoise/Water, West White Tiger/Metal, South Vermilion Bird/Fire. These Chinese Five Phases are **not** the four Western zodiac elements and should not be merged.

We adopted the *Stellarium Chinese sky-culture modern determinative-star HIP identifier series*: `65474,69427,72622,78265,80763,82514,88635,92041,100345,102618,106278,109074,113963,1067,4463,8903,12719,17499,20889,26207,26727,30343,41822,42313,46390,48356,53740,59803`.

Historic determinative-star sets **vary**, and some references differ on which main star identifies a mansion. This is tagged as one modern catalog, not canonical for all dynasties.

## What is now implemented

- `shared/chineseMansions.ts`: all 28 Xiù names, Chinese names, Stellarium HIP anchors, four regional families, a strict ingestion contract for 28 **measured RA positions** (source, frame and epoch required), 28 **unequal** boundary calculations, the Zi/Shen order warning and full-circle integrity, a body-to-mansion resolver and optional mansion-to-equal-house arc-intersection resolver.
- `client/src/components/EventChartWheel.tsx`: optional Chinese 28 Xiù RA spokes on the existing 360° wheel **ONLY IF** the verified catalog and the wheel's RA coordinate-frame metadata match. Otherwise an explicit `NOT_EVALUABLE` notice appears and no pretend 12.857° segments render.
- `client/src/components/ChineseMansionCatalog.tsx`: expandable 28-star roster with source HIP numbers, grouped by four symbols, including calibration warning.
- `client/src/pages/Home.tsx`: mounts the catalog beside the actually used diamond/circular chart pair. The existing live circle chart is a separate `Astrolabe` component and **does not yet draw the unequal reference spokes**; their plotting function is ready in `EventChartWheel`, but wiring that output into the live chart remains a separate integration step.
- `server/engine/chineseMansions.test.ts`: validates all 28 IDs, rejects missing/mixed/invalid RA data and proves sector width conservation with a labeled **synthetic fixture used only for geometry testing**, not astronomical coordinates.

## Calibration required before asserting REAL sky positions

1. Acquire the actual **HIP right-ascension degrees for each of the 28 IDs**, preferably in a stable J2000 Hipparcos catalogue with provenance. Never infer longitudes from Western zodiac signs, from 28 equal divisions, or from a guessed star position.
2. Verify the app's 360° body-coordinate frame and house Ascendant frame against the same RA and epoch as those stars. In the current engine the planetary `backgroundWheelLongitude` is J2000 equatorial RA despite variable names implying tropical ecliptic longitude. The Ascendant derives from apparent local sidereal time of date; these reference frames are not yet independently reconciled. **Do not blend them silently.**
3. Resolve known **Zi/Shen RA order inversion** with a declared epoch and a documented ordering policy. The code sorts real RA positions rather than granting a negative mansion width.
4. Wire the measured Xiù spokes into the Home page's active `Astrolabe` renderer and visible per-body mansion labels. Test planet/cusp/mansion assignment on several verified dates.
5. Keep this a **structural chart layer**, without new sports-prediction score or interpretive claims until the user asks for an interpretive method and provenance for its meanings.

## Sources

- Stellarium's modern HIP reference series and star-boundary rules: https://stellarium.org/doc/25.0/classStelSkyCultureSkyPartition.html
- Stellarium's sky-culture explanation: https://fossies.org/linux/stellarium/skycultures/chinese/description.md
- Historical changes of reference stars: https://kuangchujia.com/glossary/en/
- Unequal widths and equatorial methodology: https://www.starlodge.online/learn/measurement

**Neither 28-sector geometry nor traditional Xiù interpretations may be scored as empirically validated sports predictions.**
