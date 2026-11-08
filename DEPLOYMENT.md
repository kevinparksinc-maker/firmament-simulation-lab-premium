# Simulation Lab Premium

This is the complete sports web app. The other repositories are an early web shell (`firmament-simulation-lab`), a Kotlin preview with hardcoded results (`firmament-simulation-lab-enhanced`), and the deployed one-method baseline (`sports-prediction-absolute`).

## Run

Node 22, pnpm 10.18.0. Install with `pnpm install --frozen-lockfile`, then `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm start`. The Dockerfile runs the same installation and build. `/healthz` checks the web process; `/ready` reports engine and AI configuration without exposing credentials.

## Sports workflow

The command deck defaults to NFL. Select a real fixture or enter the teams, exact kickoff and venue coordinates. Favorite maps to ASC houses 1,2,3,6,10,11; opponent maps to DESC houses 4,5,7,8,9,12. A missing market assignment remains visibly unverified. Missing venue coordinates fail explicitly rather than substituting a different city.

The primary displayed pick and daily exports use `synthesisView`: the 21 matched core methods combine God and Agent outputs equally. The legacy baseline remains available for comparison in raw evidence. Additional registered methods and their scored/evidence-only statuses are supplied to the AI but do not silently enter the core arithmetic. A tie inside the existing 1.5-point threshold remains a tie.

The AI Master Sports Astrologer panel generates a complete reading and supports follow-up chat. Each request builds the full pregame evidence on the server, including core findings, additional methods, chart geometry and scores. It never accepts a truncated client chart dump as its authoritative evidence. Final winners and hit/miss outcomes are removed before interpretation.

## AI configuration

Set `ANTHROPIC_API_KEY` in the Render service Environment settings. `ANTHROPIC_MODEL` can override the default `claude-sonnet-4-6`. Anthropic takes priority over the legacy built-in Forge provider. Keys are never included in the repository. Without a key, calculations still work and AI returns an explicit configuration error.

For NFL fixtures linked to ESPN event IDs, pregame readings request provider weather and injury reports and verify the returned teams and kickoff. Missing reports remain NOT VERIFIED; empty injury data is never interpreted as a clean roster. Severe weather raises a NO-BET research flag without removing the calculated reading. Current reports are excluded from historical replay. These reports are not a final inactive list or a complete wind/field/roof feed.

## Limits

Database-backed saved runs require `DATABASE_URL` for the existing MySQL schema. Single game calculations, chat and local daily exports do not require a database. Exports are locally editable, not immutable publication records. The 10,000-event batch API exists, but no 10,000-game blind validation is claimed by this release. Scientific provider coordinates retain their recorded native basis in provenance; the app applies its custom XYZ projection and sunrise house convention without silently changing the coordinate basis.
