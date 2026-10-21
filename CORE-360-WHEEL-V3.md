# FIRMAMENT — Canonical 360° Wheel / Diamond Foundation (V3)

**Contract ID:** `ZODIAC_FORWARD_HOUSE_1_TO_12_V3`  
**Implementation:** `shared/firmamentWheel.ts`; legacy engine imports re-export it from `server/engine/houseFrameFoundation.ts`.

## Zero-degree Aries — permanent fixed background

The fixed 360° wheel has exactly twelve successive thirty-degree zodiac signs:

| Absolute longitudes | Sign | God View house when the fixed anchor is 0° Aries |
|---|---|---:|
| 0°–<30° | Aries | 1 — Ascendant |
| 30°–<60° | Taurus | 2 |
| 60°–<90° | Gemini | 3 |
| 90°–<120° | Cancer | 4 |
| 120°–<150° | Leo | 5 |
| 150°–<180° | Virgo | 6 |
| 180°–<210° | Libra | 7 — Descendant |
| 210°–<240° | Scorpio | 8 |
| 240°–<270° | Sagittarius | 9 |
| 270°–<300° | Capricorn | 10 |
| 300°–<330° | Aquarius | 11 |
| 330°–<360° | Pisces | 12 — directly **behind** Aries |

**Explicit human-language rule:** *Taurus is AHEAD of Aries (House 2). Pisces is BEHIND Aries (House 12).* If Scorpio becomes the first house, Sagittarius is ahead in House 2, and Libra is behind in House 12. The superseded reverse convention had these two positions switched; it is preserved ONLY in `legacyReverseHouse`, never used by new frame calculations.

## Counterclockwise screen diagram

- Start the 0° cusp at **12 o'clock** on the circular wheel.
- As increasing longitude advances **counterclockwise**, labels run Aries → Taurus → Gemini → ... → Pisces.
- House labels also advance **counterclockwise** H1 → H2 → H3 → ... → H12.
- A North Indian diamond diagram holds its house polygons fixed: H1 top diamond, H2 top-left, H12 top-right. On both UIs, a planet's reported house MUST be `locateInHouse(absoluteLongitude, frame, ascendantLongitude).house`.
- Therefore both canvases show exactly the same house cusp, occupant, side assignments and sign mapping.

## Exact-degree anchor when the Ascendant isn't 0° Aries

H1 at 25° Taurus has cusp absolute longitude 55°; H2 begins 85° (25° Gemini), H12 begins 25° (25° Aries). The first house extends Taurus 25° through Gemini 25°. **Do not collapse equal-degree houses into whole-sign assignments** just to make text simpler.

For `anchor = 55.673653°` (former Tyson–Douglas experimental east-horizon anchor), House 1 begins at Taurus 25.673653°, House 2 at Gemini 25.673653°, House 7 at Scorpio 25.673653°, and House 12 at Aries 25.673653°. The signs and decans remain fixed around the 0°–360° background, regardless of which house a body occupies.

## Canonical calculations

- `normalizeLongitude(x) = ((x % 360) + 360) % 360`, finite inputs only.
- `zodiacAt(x) = floor(normalizeLongitude(x)/30)`, sign-relative degree `x%30`.
- `houseAnchor("god", any) = 0`, `houseAnchor("agent", asc) = normalizeLongitude(asc)`.
- `houseCusp(h,frame,asc) = (anchor + (h-1)*30) mod 360`.
- `locateInHouse(longitude, frame,asc).house = floor(((longitude-anchor) mod 360)/30) + 1`.
- `arcHouseOverlaps` overlays any positive longitude arc up to 360° onto this house chart, conserving its degree span and not rotating the original sign, decan, Nakshatra or Manzil positions.
- `counterclockwiseWheelAngle(longitude) = -normalizeLongitude(longitude)-90` degrees in SVG's Y-down plane.
- **God/Agent distinction only changes the house anchor**, not any permanent zodiac sign, 10° decan, 27 Nakshatra, 28 Manzil or planet absolute angle.

## Sports territory remains independent of zodiac direction

Mike Tyson / favorite / Ascendant family: **H1, H2, H3, H6, H10, H11**.
Buster Douglas / underdog / Descendant family: **H4, H5, H7, H8, H9, H12**.
Those are role labels on numbered houses, not intrinsic properties of particular zodiac signs. Competitive methods must consistently query canonical house placement before assigning side contributions.

## Why this is a breaking change

The prior code's engine assigned positive zodiac sectors as **H1,H12,H11,...H2** while the North Indian diamond UI already showed **H1,H2,H3,...H12**. This contradiction produced fundamentally inconsistent screen labels and house counts. V3 establishes one shared source, updates Territorial house lords, full-package house cusp rulers, God and Agent planetary placements, fixed-dome sectors, Ashtakavarga house-to-sign scoring, circle-wheel and diamond diagrams. Full and isolated results now stamp the version.

**All old Tyson–Douglas scores, historical 200-game tests, old house-occupancy tables and prior 31-method comparison totals were generated before V3 and MUST be treated as archival, NOT V3 evidence.** To audit any old game, recalculate from the original input under V3. Do not combine mixed versions into accuracy reports.

## Not claimed solved

This V3 change does **not** change the deliberate zero-tilt astronomical model; it does not independently certify the body's J2000 coordinate epoch, fixed-star catalogs, traditional lunar mansion alignment, planetary altitude or the sports prediction doctrine. These remain separately scoped audit blockers. The V3 work concerns the **fundamental order and consistent mapping** of a 360° wheel and its diamond rendering.

## Tests

`server/engine/zodiacForwardCore.test.ts` verifies zodiac order, Pisces behind Aries, Taurus ahead, the Scorpio variant, exact-degree Ascendant shift, source-arc conservation, and counterclockwise angular mapping. Other geometry and 31-method pipeline tests must pass before any merge.
