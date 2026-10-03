# Evaluation Framework: Ascendant vs Descendant

## Primary rule

Firmament Observatory evaluates:

- **Side A = Ascendant framework = favored to win**
- **Side B = Descendant framework = underdog**

This is **not** a home-versus-away evaluation. Home/away is retained as event metadata only.

For a verified event:

```text
actualWinner = A → favored team won
actualWinner = B → underdog won
actualWinner = TIE → no decisive result
```

## Input contract

Every primary-research event should identify:

```ts
{
  favoredTeam,
  underdogTeam,
  homeTeam,
  awayTeam,
  roleAssignmentSource: "market-odds" | "expert-consensus" | "manual"
}
```

The engine maps `favoredTeam` to its internal `teamA` / Ascendant side and `underdogTeam` to `teamB` / Descendant side. `homeTeam` and `awayTeam` do not control the prediction label or hit/miss result.

## Eligibility rule

Events without explicit favored/underdog assignments are marked:

```text
roleAssignmentSource = legacy-side-order
primaryResearchEligible = false
```

They may still be used for engine smoke tests, but they must not be included in the primary predictive backtest.

## Impact on the previous MLB backtest

The September 24, 2026 MLB artifact used source-order `teamA/teamB` fields and did not contain verified favorite/underdog labels. Therefore its previous hit rates must be treated as **engine diagnostics only**, not valid favored-versus-underdog research results.

The artifact is preserved for audit history. A corrected backtest requires a historical odds or consensus-favorite source for every game.

## Recommended canonical event schema

```ts
interface CanonicalGame {
  gameId: string;
  sport: string;
  league: string;
  season: string;
  startTimeUtc: string;
  venueName: string;
  latitude: number;
  longitude: number;
  favoredTeam: string;
  underdogTeam: string;
  homeTeam: string;
  awayTeam: string;
  actualWinner: "A" | "B" | "TIE";
  roleAssignmentSource: "market-odds" | "expert-consensus" | "manual";
  sourceGameId: string;
}
```

This separation ensures that all hit/miss statistics use the intended Ascendant/Descendant framework rather than a hidden home-field proxy.
