# Experimental Evidence Layers Audit

## Scope

This change implements the requested **Harmonics, Vargas, Ashtakavarga, and Dasha** extension as a separate, read-only research surface. The existing Territorial/KP prediction and the existing 21-method frame synthesis remain unchanged.

## Existing architecture reviewed

- `server/engine/firmamentEngine.ts` already provided the `Prediction` contract, planetary readings, house assignments, KP 249 lookup, and Vimshottari-proportional Sub/Sub-Sub helpers.
- `server/engine/territorialStack.ts` contains the active territorial score and evidence layers.
- `server/engine/simulationAdapter.ts` exposes both God View and Agent View and preserves the existing 21-layer frame output.
- The existing live house clusters are `A = [1,3,6,10,11]`, `B = [4,5,7,9,12]`, with H2/H8 neutral. The specification requires a separate experimental family mapping, so the new layers use `A = [1,2,3,6,10,11]` and `B = [4,5,7,8,9,12]` without changing the live clusters.

## Implemented module

`server/engine/experimentalLayers.ts`

### Harmonics

- Supports arbitrary `Hn` through `calculateHarmonic`.
- Default enabled spectrum is H2–H12.
- Uses `delta`, all `k * (360 / n)` targets, circular residual, configurable maximum orb, and linear/Gaussian falloff.
- Separates internal A coherence, internal B coherence, and cross-family interaction.
- Does not infer direction from symmetric harmonic geometry.

### Vargas

- Implements explicit D3, D9, D10, D27, and D30 placement records.
- Records the selected convention, source longitude, divisional sign, degree within Varga, derived house, sign lord, and A/B family.
- Emits structural evidence rather than treating a Varga as inherently decisive.

### Ashtakavarga

- Emits seven Bhinnashtakavarga rows for the visible planets.
- Aggregates house bindus into Sarvashtakavarga totals and maps them to the requested A/B house families.
- The support tables and family mapping are explicit and labeled as a research baseline; they require frozen backtest validation before any production use.

### Dasha

- Reuses the existing KP/Vimshottari chain: Moon longitude → Nakshatra lord → Sub-Lord → Sub-Sub-Lord.
- Maps each active chain planet through A/B house-family testimony.
- Clearly labels the output as an **event-chart timing chain**, because sports inputs do not include a natal epoch from which an age-based active Dasha can be resolved.

### Cross-layer contract

Every layer emits:

```ts
{
  layer,
  method,
  scoreA,
  scoreB,
  winner,
  confidence,
  rationale,
  evidence,
  status: "experimental-read-only"
}
```

The result also exposes `verdicts[]` and `crossLayer`, which preserve structural, relational, and temporal disagreement instead of averaging it away. Ashtakavarga remains a separate quantified positional-support layer.

## Integration

`runSimulationEvent` now returns:

```ts
experimentalLayers: {
  status: "experimental-read-only",
  note: string,
  godView: ExperimentalLayerResult,
  agentView: ExperimentalLayerResult
}
```

The new output is available for API responses, JSON exports, and backtests. It is intentionally **not** appended to `godView.allLayers` or `agentView.allLayers`, so existing production scores, 21-method counts, frame parity checks, and reports do not change.

## Verification

- TypeScript check: passed
- Test suite: **29 tests passed** across 6 files
- Production build: passed for Vite client and bundled server
- Added tests cover house-family separation, arbitrary harmonic calculation, all four layers, cross-layer output, and simulation adapter exposure.

## Remaining research boundary

The specification describes a future time-series harmonic flow layer and a future backtest/synthesis stage. This implementation provides the static H2–H12 spectrum and a cross-layer analyzer, but does not feed either into the production winner. The next safe step is a frozen historical backtest comparing each layer's incremental information against the unchanged baseline.
