# Evidence-Layer Coverage Report

Generated: 2026-09-25

## Full integration suite

Command:

```bash
pnpm exec vitest run \
  --coverage \
  --coverage.reporter=text \
  --coverage.reporter=json-summary \
  --coverage.reporter=html
```

Result:

- **6 test files passed**
- **29 tests passed**
- **0 failures**
- Full-project statement coverage: **18.16%**
- Full-project branch coverage: **78.93%**
- Full-project function coverage: **47.35%**
- Full-project line coverage: **18.16%**

The full-project totals include client/UI and server infrastructure files that are not exercised by the Node integration suite. The focused report below is the relevant quality signal for the new evidence-layer implementation.

## Focused evidence-layer coverage

Command:

```bash
pnpm exec vitest run \
  server/engine/experimentalLayers.test.ts \
  server/engine/simulationAdapter.test.ts \
  --coverage \
  --coverage.include=server/engine/experimentalLayers.ts \
  --coverage.reportsDirectory=coverage/evidence-layers
```

Result:

- **2 test files passed**
- **9 tests passed**
- **0 failures**
- Statements: **97.77%** — 132/135
- Lines: **97.77%** — 132/135
- Functions: **100%** — 18/18
- Branches: **85.96%** — 98/114

## Report artifacts

- [Focused HTML coverage report](coverage/evidence-layers/index.html)
- [Focused JSON coverage summary](coverage/evidence-layers/coverage-summary.json)
- [Full-project HTML coverage report](coverage/index.html)
- [Full-project JSON coverage summary](coverage/coverage-summary.json)

## Interpretation

The new evidence-layer module has high statement, line, and function coverage. The remaining uncovered branches are primarily defensive and alternate-path cases, including empty/neutral family paths, missing planetary inputs, and boundary fallbacks. The full suite also validates adapter integration so the four read-only layers are exposed for both God View and Agent View without changing the existing 21-method production synthesis.
