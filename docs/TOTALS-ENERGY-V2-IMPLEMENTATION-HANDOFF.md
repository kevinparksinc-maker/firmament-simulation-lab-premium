# Simulation Lab Premium — Experimental Over/Under Energy V2

## Code delivered
- `server/engine/totalsEnergyV2.ts`: executable pure function `calculateTotalsEnergyV2`; 10 baseline × 10 event planets, one of eight qualifying aspects per pair, max orb 5°, 1–5 stepped intensity, planet and aspect weights identical to The Absolute `server/energyReadV2.ts`.
- `server/engine/totalsEnergyV2.test.ts`: initial tests for aspect list, score ledger, market pushes, post-event market rejection, invalid planet inputs.

## Exact scoring
Score = baseline planet weight + event planet weight + aspect weight + intensity. Harmony: conjunction, trine, sextile, quintile. Friction: opposition, square, quincunx, semisquare. No contacts => null percentages, no fake 50/50. All contacts expose score and orb.

## Important research caveats
The Absolute V2 is **natal vs transit**. A game has no agreed natal chart. Therefore `baseline` and `event` must be independently specified and sourced; **do not silently equate a team founding date or a kickoff chart with a natal chart**. Freeze and document a legitimate baseline definition before any blind test. A one-chart alternative (event aspects within the same chart) is a different method and requires separately versioned rules. Caller must supply actual fixed-frame positions; this module does not calculate ephemeris positions or pretend the old J2000 path is canonical.

Signal is **experimental directional hypothesis only**: harmony > friction = over-hypothesis; friction > harmony = under-hypothesis; equal = mixed; none = no-contacts. It is not a point projection, probability, betting edge, or recommendation. Score against sportsbook total (push preserved) and against a no-skill market baseline, by sport and season. No outcome leakage.

## Remaining work for Manus / integration
1. Finish the verified canonical planetary coordinate migration from the chart-parity PR and house-order PR. Never feed `generateFixedJ2000...` outputs into this module under a canonical frame label.
2. Choose and freeze the baseline chart methodology, provenance, timing and venue rules; add data contract, canonical source, event-time integrity and duplicate prevention.
3. Add optional input fields to the simulation event API: sportsbookTotal, marketRecordedAt, finalTotal. Ensure finalTotal is accessible **only in postgame evaluation**, never in model input at inference.
4. Wire `calculateTotalsEnergyV2` through an **opt-in research endpoint** and a UI panel. Keep 31 registered winner methods unchanged. Show ledger, counts, harmony/friction totals, orb, God/Agent houses, market line, signal and eventual outcome.
5. Build walk-forward blind validation across sports; lock coefficients before holdout; report sample size, push count, over/under confusion matrix, ROI after vig only with historical odds and credible uncertainty intervals.
6. Run `npm run check`, `npm test`, `npm run build`; review and merge only after full tests and integration.

## Status
Calculator and initial tests committed. **Not yet wired into active simulation adapter, API or UI. No tests executed by this assistant.** No claim of complete deployment.
