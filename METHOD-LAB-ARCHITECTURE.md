# Firmament Observatory Method Laboratory

## Phase 1 status

Implemented on 2026-09-27:

- Typed `MethodSpec`, `MethodInput`, `MethodResult`, and `MethodEvidence` contracts.
- Nullable scores for non-evaluable/evidence-only outputs.
- Central `METHOD_REGISTRY` with versioned entries.
- Independent registry entries for D3, D9, D10, D27, and D30.
- Versioned harmonic models:
  - `HARMONICS_V1`: existing harmonic-specific Gaussian model with calibrated orbs.
  - `HARMONICS_V2`: universal 5° linear model.
- Registry results are emitted in every simulation event under `methodResults` without replacing the existing production or experimental output surfaces.
- Boundary tests for the V2 resonance model and contract tests for missing natal context.

## Method result contract

```ts
interface MethodResult {
  methodId: string;
  mode: "PREDICTIVE" | "EVIDENCE_ONLY";
  evaluable: boolean;
  scoreA: number | null;
  scoreB: number | null;
  prediction: "A" | "B" | "TIE" | "NONE";
  confidence: number | null;
  evidence: MethodEvidence[];
  detail: string;
  calculationVersion: string;
}
```

Evidence-only methods can therefore remain visible in the research surface without being included in predictive hit-rate rankings.

## Harmonic version policy

The current Gaussian implementation was preserved as `HARMONICS_V1`; it was not silently replaced.

`HARMONICS_V2` applies:

```text
harmonicLongitude = (longitude × harmonic) % 360
0° residual  → 100% resonance
1° residual  → 80%
2° residual  → 60%
3° residual  → 40%
4° residual  → 20%
5° residual  → 0%
>5°          → inactive
```

Both models are independently callable and receive distinct calculation versions in stored results.

## Current registry entries

| Method ID | Family | Mode | Version |
|---|---|---|---|
| `HARMONICS_V1` | Harmonics | Predictive | 1.0.0 |
| `HARMONICS_V2` | Harmonics | Predictive | 2.0.0 |
| `VARGA_D3_V1` | Vargas | Predictive | 1.0.0 |
| `VARGA_D9_V1` | Vargas | Predictive | 1.0.0 |
| `VARGA_D10_V1` | Vargas | Predictive | 1.0.0 |
| `VARGA_D27_V1` | Vargas | Predictive | 1.0.0 |
| `VARGA_D30_V1` | Vargas | Predictive | 1.0.0 |
| `ASHTAKAVARGA_V1` | Ashtakavarga | Predictive | 1.0.0 |
| `EVENT_LUNAR_DASHA_CHAIN_V1` | Dasha | Predictive | 1.0.0 |
| `NATAL_VIMSHOTTARI_V1` | Dasha | Predictive | 1.0.0 |

## Deliberate compatibility boundary

The registry is additive. Existing `experimentalLayers` and production Territorial/KP outputs remain available and unchanged. This permits old simulation artifacts to remain comparable while new method results carry explicit IDs and versions.

## Next phases

1. Add a canonical 10,000-event manifest with dataset and configuration hashes.
2. Store raw game × method records and train/validation/test partitions.
3. Add coverage-aware aggregate statistics and a readiness gate.
4. Migrate remaining production/evidence methods into the registry.
5. Add a research dashboard for selecting individual divisions and harmonic versions.
