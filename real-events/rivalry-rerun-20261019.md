# Seven-game annual rivalry rerun after collective-family repairs

**Engine source:** main at rerun branch creation, collective family integration merged at `53aa899e7c201e2b1ef533b2d3c07ad64c063276`.  
**Rerun test:** existing `server/engine/annualRivalryPilot.test.ts`; same seven historical fixtures, no fixture changes, no coefficient tuning.  
**CI:** GitHub Actions `39372421406` (Daily studio validation, success) and `39372421420` (Firmament validation, success).

## Full-game hits

| View | Earlier pilot | Current rerun |
|---|---:|---:|
| God View | 2/7 | **3/7 (42.9%)** |
| Agent View | 2/7 | **2/7 (28.6%)** |
| Cross-frame Synthesis | 2/7 | **2/7 (28.6%)** |
| Favorite-only comparison | 5/7 | **5/7 (71.4%)** |
| Prior internal baseline | 1/7 | **1/7** |

## Game-by-game actual winner and predictions

| Fixture | True winning side | God | Agent | Synthesis |
|---|---|---|---|---|
| 2023 Michigan–Ohio State | A — Michigan | B wrong | B wrong | B wrong |
| 2024 Michigan–Ohio State | B — Michigan | B correct | B correct | B correct |
| 2023 Iron Bowl | A — Alabama | B wrong | B wrong | B wrong |
| 2024 Iron Bowl | A — Alabama | B wrong | B wrong | B wrong |
| 2025 Iron Bowl | A — Alabama | B wrong | B wrong | B wrong |
| 2023 Red River | B — Oklahoma | B correct | B correct | B correct |
| 2024 Red River | A — Texas | A correct | B wrong | B wrong |

## Highlights across 21 methods (hit counts out of 7)

| Method | God | Agent | Synthesis |
|---|---:|---:|---:|
| Cluster territory / house lords | 2 | 2 | 2 |
| Nakshatra | 4 | 2 | 2 |
| Essential dignity | 1 | 4 | 1 |
| Chaldean decans | 2 | 2 | 2 |
| Planetary war | 3 | 2 | 2 |
| Arabic Lots | 2 | 1 | 1 |
| Arabic mansion context | 1 | 2 | 1 |
| Nine-planet influence | 2 | 3 | 2 |
| Fixed stars | 0 (7 ties) | 0 (7 ties) | 0 (7 ties) |
| Retrograde | 2 | 3 | 2 |
| Lunar flow | 5 | 1 | 1 |
| **Chart-wide aspects** | **4** | **5** | **5** |
| Moon phase/VOC | 0 (7 ties) | 0 (7 ties) | 0 (7 ties) |
| Lunar nodes | 4 | 3 | 3 |
| Upachaya | 1 | 3 | 3 |
| Via Combusta | 0 | 1 | 1 |
| Besiegement | 0 (7 ties) | 0 (7 ties) | 0 (7 ties) |
| Mutual reception | 1 | 0 | 1 |
| Translation of light | 2 | 2 | 2 |
| Harmony vs friction | 2 | 4 | 3 |
| KP chain | 5 | 4 | 3 |

**Interpretation:** This tests what the running current implementation produced, not whether the 21 traditional and experimental doctrines are mathematically or empirically valid. Several methods have neutral no-calls which are not misses, so a method's raw hit count is not its conditional accuracy. Seven games are insufficient to validate prediction performance.

**Critical unresolved case:** Alabama won all 2023/2024/2025 Iron Bowls but the God, Agent and Synthesis frames all forecast Auburn in each case. Do not tune coefficients to these results; examine event-local input quality, every 12-house family ledger, and the underlying A/B contribution distribution.

**Data quality:** Only the 2023 Iron Bowl fixture is explicitly flagged with an `actual` kickoff time. The others are flagged `scheduled`; odds and verified role assignments require further independent corroboration before interpreting accuracy.

**Important architecture caveat:** PR #32 attaches full family data to the evidence for all 21 method rows. That does not automatically change each method's individual scoring formula. Therefore this rerun is **not** a test of a completely implemented collective-family scoring doctrine.
