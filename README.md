# Soccer Analysis

Soccer Analysis is a Next.js betting-research dashboard for weekly soccer fixtures. It lists games from the main leagues, computes auditable probabilities from structured stats, and uses the Codex SDK to generate short research notes when configured.

## Features

- Weekly fixture list for major European leagues and Brasileirao Serie A.
- API-Football integration for live fixture and match statistics data.
- Demo fixture fallback when no API key is configured.
- Deterministic probabilities for:
  - 1X2
  - over 2.5 goals
  - both teams to score
  - over 8.5 corners
  - over 3.5 yellow cards
  - at least one red card
- Confidence labels and missing-data warnings.
- Codex SDK analysis adapter with a local fallback insight.
- Lint, unit tests, and production build scripts.

## Requirements

- Node.js 18 or newer
- npm
- Optional: an API-Football key for live fixture data
- Optional: Codex authentication or `CODEX_API_KEY` for live Codex-generated insights

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Configure the values you want:

```env
API_FOOTBALL_KEY=your_api_football_key
CODEX_API_KEY=your_optional_codex_api_key
CODEX_USE_LOCAL_AUTH=false
CODEX_MODEL=gpt-5.3-codex
```

`API_FOOTBALL_KEY` enables live soccer data. Without it, the app shows demo fixtures.

`CODEX_API_KEY` enables live Codex SDK insights in hosted or explicit API-key environments. For local development with an already-authenticated Codex CLI/session, set `CODEX_USE_LOCAL_AUTH=true`. Without Codex access, the app still works and uses fallback research notes.

## Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Validation

Run the test suite:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## How It Works

The server API routes keep provider credentials out of the browser. `/api/fixtures` loads this week’s fixtures, and `/api/fixtures/[id]/analysis` enriches a selected match with trends, computes probabilities, and asks the Codex SDK for a structured explanation.

The percentages are calculated by local TypeScript logic in `src/lib/probability/engine.ts`. The AI layer explains the calculated outputs; it is not the source of truth for the numbers.

## Responsible Use

This app is a research assistant, not a betting platform. It does not place bets, guarantee results, or remove risk. Always compare model percentages with bookmaker implied probabilities and treat low-confidence markets carefully.
