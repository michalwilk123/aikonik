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

## Chat and tests

The four-agent assistant uses true server streaming, smooth client reveal and
D1-backed conversation history. Accepted user and assistant messages, partial
responses, model timings/usage/errors, tool calls and browser metadata are
persisted without copying the transcript on each request.

Run `bun run test` for deterministic pure and actual D1 tests, then
`bunx playwright install chromium` and `bun run test:e2e` for browser checks.
CI and deployment run these suites without AI credentials.

Live model evaluations are separate: supply `OPENROUTER_API_KEY` in your
shell and run `bun run eval:openrouter`. They use synthetic conversations,
Gemini 3.1 Flash Lite with minimal thinking, bounded provider calls and a
disposable database. They report every attempt and never gate ordinary CI.

See [chat testing and storage](docs/chat-testing.md) for commands, coverage,
streaming behavior and D1 guarantees. The selected ROPS report facts describe
2024, not current service availability. No business submission or messaging
operation is available to the agents.

## Migrations

Edit `db/schema.ts`, run `bun run db:generate`, commit `drizzle/`, then
`db:migrate:local` / `db:migrate:remote` (CI applies remote on deploy).

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml` (checks, build, D1
migrations, deploy). Required GitHub secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`. Set the runtime secret once:
`bunx wrangler secret put OPENROUTER_API_KEY`.
