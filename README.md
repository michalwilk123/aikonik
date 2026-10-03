# hubmi

Next.js 16 (React Compiler, Tailwind v4, shadcn) on Cloudflare Workers via
OpenNext, with Cloudflare D1 + Drizzle ORM. Lint/format with Biome, dead code
with knip. Package manager: bun.

## Architecture

- [Chat architecture and research](docs/architecture.md) — agent behavior,
  D1 persistence, context handling, streaming, and testing plan.

- `app/` - presentation (Next.js routes), `components/` - UI
- `domain/` - pure business rules
- `application/` - use cases
- `infrastructure/` - adapters (AI, external services)
- `db/` - Drizzle schema and per-request D1 client (`getDb()`)
- `drizzle/` - generated SQL migrations

## Local dev

```sh
bun install
cp .dev.vars.example .dev.vars   # fill in OPENROUTER_API_KEY
bun run db:migrate:local
bun run dev
```

## Scripts

`dev`, `build`, `lint`, `format`, `check` (biome --write), `typecheck`, `knip`,
`cf-typegen` (regenerate `cloudflare-env.d.ts` after editing wrangler.jsonc),
`build:cloudflare`, `preview`, `deploy`, `db:generate`, `db:migrate:local`,
`db:migrate:remote`.

## Tests

Run `bun run test:pure` (or `bun run test`) for deterministic tests in
`tests/pure/`. These tests require no AI credentials or external services.
Both CI and deployment checks run only this test suite. Keep any future
token-backed model evaluations under `evals/`, outside `tests/pure/`, and
run them explicitly; CI does not supply an OpenRouter key or run evaluations.

## AI model

The chat uses `google/gemini-3.1-flash-lite` with minimal thinking through OpenRouter. All model-backed
features should use the shared factory in `infrastructure/ai/openrouter.ts`.
The Worker reads `OPENROUTER_API_KEY` per request; no secret is bundled into the
browser. There is no hardcoded answer or fallback model. Responses are validated
against the card schema, and provider failures show an error in the chat.
Model requests have a 30-second deadline. The browser independently stops
waiting after 45 seconds, removes the loading indicator, and allows another
message. This also covers a stalled Server Action transport; it does not itself
cancel server execution, which has its own deadline.

The small ROPS report sample provides context, not a verified service catalog.
Generated recommendations are suggestions; current service lookup and the
Social Canvas agent remain implementation work described in the architecture.

## Migrations

Edit `db/schema.ts`, run `bun run db:generate`, commit `drizzle/`, then
`db:migrate:local` / `db:migrate:remote` (CI applies remote on deploy).

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml` (checks, build, D1
migrations, deploy). Required GitHub secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`. Set the runtime secret once:
`bunx wrangler secret put OPENROUTER_API_KEY`.
