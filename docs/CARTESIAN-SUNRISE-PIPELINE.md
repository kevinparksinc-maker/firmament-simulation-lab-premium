# Active Cartesian XYZ and sunrise pipeline

This document supersedes the coordinate descriptions in historical audit bundles.
Saved backtest JSON and old source bundles are historical records, not the active engine.

## Calculation

1. Validate the event UTC instant and observer coordinates. Unknown venues require
   explicit coordinates; coordinates are never fabricated from a location-name hash.
2. Calculate the most recent sunrise within 25 hours before the event with Astronomy
   Engine `SearchRiseSet`. This models the solar upper limb with standard refraction
   for a sea-level observer. Before-dawn events use the preceding sunrise. A supplied
   sunrise must identify its source and pass the same time-window validation.
3. Obtain the Sun's XYZ vector **at sunrise**, separately from the body vectors at
   the event instant. The projected angle is `normalize(atan2(y, x) * 180 / pi)`.
4. Set `ASC = normalize(sunriseSunAngle + elapsedUtcHours * 15)`.
   This is the user-defined 15-degree hourly rotation, with no sidereal rate,
   sidereal zodiac, ayanamsa, precession, tilt rotation, or added 90-degree ASC term.
5. Agent View cusp Hn is `normalize(ASC + (n - 1) * 30)`; a body's house is
   `floor(normalize(bodyAngle - ASC) / 30) + 1`. God View uses the same body angles
   against its fixed background houses. Signs and mansion overlays do not move.
6. Pass the completed chart into the two frame evaluations, registered method
   snapshots, evidence ledgers, and the existing 21-method-per-frame synthesis.
   The Master Sports Astrologer receives these computed records downstream.

## Source provenance is separate from the projection

Cartesian coordinates require specified axes. Astronomy Engine 2.1.19 `GeoVector`
returns event-time geocentric XYZ in its native EQJ (J2000 equatorial) basis, in AU,
with light-time correction and aberration disabled. The app consumes those vectors
directly; it does not convert them into a J2000 ecliptic zodiac or sidereal zodiac.
The provider's native-basis label is deliberately retained in the calculation receipt.
Changing the basis requires a defined replacement orientation and matching stellar
catalog; deleting its name would not change the coordinates.

The Chinese determinative-star reference table retains its cited catalog frame.
It is fixed stellar evidence, not a second planetary calculation path. Historical
audit files also retain their original source labels.

Rahu and Ketu retain the engine's existing **mean-node model**, not a claim that
they are ephemeris bodies. Their explicit polynomial and opposite XY unit-vector
construction are recorded in provenance. Day/night sect uses a sunrise-model
horizon altitude derived from latitude, solar declination, and the same 15-degree
hourly rotation; it does not recalculate the custom ASC.

## Code map

| Stage | Source |
| --- | --- |
| Ephemeris vectors, sunrise, observer validation and source receipt | `server/engine/cartesianEphemeris.ts` |
| Sun XY angle and exact 15-degree hourly ASC | `server/engine/absoluteSunriseAscendant.ts` |
| Completed Cartesian chart | `server/engine/cartesianEventChart.ts` |
| Shared house cusps and placement | `server/engine/houseFrameFoundation.ts` |
| Prediction and KP/territorial consumers | `server/engine/firmamentEngine.ts` |
| God and Agent evaluations | `server/engine/fullPackageDualFrameChallenger.ts` |
| Event orchestration and returned receipt | `server/engine/simulationAdapter.ts` |
| Frozen registered-method snapshots | `server/engine/methodChartSnapshot.ts` |
| Interpreter input | `server/masterSportsAstrologer.ts` |
| Wheel uses returned cusps | `client/src/components/EventChartWheel.tsx` |

The disabled adapter guard, old J2000 prediction APIs and duplicate coordinate
fields, alternate model wrappers, and mode-14 sidereal provider have been deleted.
API model selection accepts only the sunrise Agent View. Missing sunrise,
invalid coordinates, or an unavailable polar sunrise raises an error.

## Validation

`cartesianPipeline.test.ts` verifies unshifted event XYZ projections, independent
sunrise Sun sampling, exact 15-degree hourly advancement, matching chart/ledger
house assignments, method coverage, reconciled totals, before-dawn handling,
invalid inputs, and polar sunrise failure. The remaining coordinate fixtures use
the same increasing 30-degree equal-house rule.
