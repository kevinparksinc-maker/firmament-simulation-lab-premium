# MLB September 24, 2026 — Evidence-Layer Test

Source: [MLB Stats API](https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=09/24/2026&hydrate=venue,team)

**12 final games** were simulated. Side A is the away team; Side B is the home team. All events include the official final winner.

## Results

| Game | Final | Baseline | Harmonics | Vargas | Ashtakavarga | Dasha |
|---|---|---:|---:|---:|---:|---:|
| St. Louis Cardinals @ Pittsburgh Pirates | Pittsburgh Pirates | B (hit) | A (MISS) | A (MISS) | TIE (TIE) | B (HIT) |
| Chicago White Sox @ Kansas City Royals | Chicago White Sox | B (miss) | A (HIT) | B (MISS) | TIE (TIE) | A (HIT) |
| Miami Marlins @ Chicago Cubs | Chicago Cubs | B (hit) | A (MISS) | A (MISS) | TIE (TIE) | A (MISS) |
| New York Mets @ Texas Rangers | Texas Rangers | B (hit) | A (MISS) | B (HIT) | TIE (TIE) | A (MISS) |
| Arizona Diamondbacks @ Colorado Rockies | Arizona Diamondbacks | B (miss) | A (HIT) | B (MISS) | TIE (TIE) | B (MISS) |
| Milwaukee Brewers @ Philadelphia Phillies | Milwaukee Brewers | B (miss) | A (HIT) | B (MISS) | TIE (TIE) | B (MISS) |
| Cleveland Guardians @ Boston Red Sox | Cleveland Guardians | B (miss) | A (HIT) | A (HIT) | TIE (TIE) | B (MISS) |
| Tampa Bay Rays @ New York Yankees | New York Yankees | B (hit) | A (MISS) | B (HIT) | TIE (TIE) | A (MISS) |
| Cincinnati Reds @ Atlanta Braves | Cincinnati Reds | B (miss) | A (HIT) | B (MISS) | TIE (TIE) | B (MISS) |
| Houston Astros @ Athletics | Houston Astros | B (miss) | A (HIT) | B (MISS) | TIE (TIE) | B (MISS) |
| Los Angeles Angels @ Seattle Mariners | Los Angeles Angels | B (miss) | A (HIT) | A (HIT) | TIE (TIE) | B (MISS) |
| San Diego Padres @ Los Angeles Dodgers | San Diego Padres | B (miss) | A (HIT) | B (MISS) | TIE (TIE) | B (MISS) |

## Aggregate God View evidence-layer results

- **harmonics:** 8 hits, 4 misses, 0 ties; evaluable hit rate 66.7%.
- **varga:** 4 hits, 8 misses, 0 ties; evaluable hit rate 33.3%.
- **ashtakavarga:** 0 hits, 0 misses, 12 ties; evaluable hit rate 0.0%.
- **dasha:** 2 hits, 10 misses, 0 ties; evaluable hit rate 16.7%.
- **Baseline:** 4 hits / 12 verified events; accuracy 33.3%.

## Notes

- This is a research/backtest run, not betting advice.
- The experimental layers remain read-only and do not modify the production baseline winner.
- The JSON artifact preserves the exact event inputs, scores, verdicts, evidence, and frame outputs.
