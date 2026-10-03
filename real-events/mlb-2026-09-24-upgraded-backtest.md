# Upgraded MLB September 24, 2026 Backtest

> **Framework warning:** This historical artifact used source-order `teamA/teamB` and did not include verified favored/underdog assignments. It is preserved as an engine diagnostic, but its hit rates are **not valid primary Ascendant/favored-vs-underdog research results**. A corrected run requires historical favorite/underdog labels.

Source: [MLB Stats API](https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=09/24/2026&hydrate=venue,team)

**12 verified final games**. The original artifact's Side A/Side B order is retained for reproducibility only.

## God View aggregate

| Layer | Hits | Misses | Ties | Evaluable hit rate |
|---|---:|---:|---:|---:|
| harmonics | 8 | 4 | 0 | 66.7% |
| varga | 4 | 8 | 0 | 33.3% |
| ashtakavarga | 8 | 4 | 0 | 66.7% |
| dasha | 2 | 10 | 0 | 16.7% |
| baseline | 4 | 8 | 0 | 33.3% |

## Agent View aggregate

| Layer | Hits | Misses | Ties | Evaluable hit rate |
|---|---:|---:|---:|---:|
| harmonics | 7 | 5 | 0 | 58.3% |
| varga | 4 | 8 | 0 | 33.3% |
| ashtakavarga | 8 | 4 | 0 | 66.7% |
| dasha | 10 | 2 | 0 | 83.3% |

## Correct next step

Collect historical odds or consensus favorite labels, map the favorite to Ascendant/Side A and the underdog to Descendant/Side B, then rerun the full batch. Do not compare the resulting rates to this artifact as though they share the same evaluation frame.
