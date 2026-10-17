# Simulation Lab — Saturday college-football readiness audit (2026-10-16)

## Scope and verification
Reviewed current `main` repository routes, UI, schedule ingestion, simulation adapter, CSV importer, experimental layer audit, and latest GitHub Actions results. The latest pre-change `main` GitHub workflow passed. This audit is code-level, not a live-browser or production endpoint certification.

## Confirmed existing capabilities
- Home observatory and Daily Studio routes are wired.
- `schedules.list` accepts `NCAAF` and a YYYY-MM-DD date, backed by the ESPN college-football scoreboard.
- `simulate.event` accepts NCAAF, team roles, event time and venue coordinates.
- Engine uses favorite as Ascendant when supplied; legacy team ordering otherwise.
- House family assignments cover all 12 houses: Ascendant 1/2/3/6/10/11 and Descendant 4/5/7/8/9/12.
- Advanced Harmonics/Vargas/Ashtakavarga/Dasha are calculated but intentionally experimental/read-only.
- Current `main` build, type check, and test suite passed in GitHub Actions before this PR.

## Critical gaps found and changes in this PR
1. **Tomorrow's games were not readily accessible.** Home's previous rail used today's UTC date and `schedules.live`, which returned only live games or a truncated cross-sport fallback. Added a date picker and NCAAF-first filter using `schedules.list` so October 17 fixtures can be selected directly.
2. **Market favorites were discarded by the UI.** Home passed only original away/home team names to the simulation. Now passes favored/underdog roles and `market-odds` source when both are actually available. Missing odds remain explicitly `legacy-side-order` and must not be counted as a verified favorite-vs-underdog prediction.
3. **Known stadium coordinates were discarded.** Home now passes the feed's coordinates when available.
4. **Historical NCAAF CSVs were rejected.** Parser now accepts NCAAF and the other supported league identifiers, with a test preserving missing actual winners.

## Outstanding before calling the whole system validated
- **Real-world smoke test:** deploy `main`, open Saturday NCAAF schedule, select a game, run both views, inspect evidence, confirm no server exceptions.
- **Schedule availability:** external ESPN endpoint may fail or change; UI must clearly show unavailable data. No Saturday games were independently loaded into the deployed app during this audit.
- **Venue precision:** most football venues lack coordinates in the current provider mapping; the engine must expose whether it is using a fallback location before claiming precise local chart calculations.
- **Odds coverage:** ESPN may omit or change favorites. Never infer a favorite from home/away without market evidence.
- **Advanced-layer accuracy:** experimental methods have tests but are not validated predictors; do not silently promote them into the live synthesis.
- **10,000-game backtest:** no verified 10,000-row market-favorite-labeled dataset was established. Previous 12-game MLB diagnostic explicitly lacks historical favorite assignment.
- **Visual QA:** desktop and mobile browser testing and a deployed URL are still required.
- **Security and operations:** API rate limits, authentication of costly operations, dataset import permissions, monitoring, and provider outage behavior need production review.

## Release criterion
Merge this PR only after CI checks pass. Then verify the deployment points to the latest `main` SHA, set date to 2026-10-17, select NCAAF, and run a complete real fixture with odds status visibly reported. Passing CI is not proof of live data availability or forecasting accuracy.
