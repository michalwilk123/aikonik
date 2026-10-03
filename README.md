# Aikonik

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

Run `bun run test` for deterministic pure and actual D1 tests.
CI and deployment run these suites without AI credentials.

Live model evaluations are separate: supply `OPENROUTER_API_KEY` in your
shell and run `bun run eval:openrouter`. They use synthetic conversations,
Gemini 3.1 Flash Lite with minimal thinking, bounded provider calls and a
disposable database. They report every attempt and never gate ordinary CI.

See [chat testing and storage](docs/chat-testing.md) for commands, coverage,
streaming behavior and D1 guarantees. The selected ROPS report facts describe
2024, not current service availability. No business submission or messaging
operation is available to the agents. Visitors explicitly send completed drafts
using the separate submission form; the model cannot send them itself.

## Staff panel

Payload supplies the staff UI; Better Auth supplies email/password login.
`/cms` opens the staff dashboard with three inboxes: contact, residents’ ideas
and innovation testing. Staff can set a case status, assign any staff member and
save internal notes. Visitor contact data and submitted content remain read-only.
Ideas display the Social Canvas as twelve sections, including unanswered areas.
The dashboard shows new-case counts, recent submissions and a link to the
current user’s open cases. The `cms` role can read the staff directory for
assignment and edit their own account settings; administration of other accounts
and technical chat data remain restricted. `/admin` gives administrators access to
submissions, staff accounts and all stored chat records. Public visitors do not
need accounts. Registration and email password recovery are disabled.

Configure `PAYLOAD_SECRET` in `.dev.vars` locally and with `wrangler secret put
PAYLOAD_SECRET` in production. `SITE_URL` in `wrangler.jsonc` is the canonical
production origin; local development uses the Next.js port.

Apply D1 migrations, then seed staff:

```sh
bun run db:migrate:local
STAFF_INITIAL_PASSWORD='choose-a-password' bun run cms:seed
# Production, with the desired initial password in STAFF_INITIAL_PASSWORD:
bun run db:migrate:remote
bun run cms:seed --remote
```

The seed creates `cms@hubmi.invalid` and `admin@hubmi.invalid`. Re-running preserves
existing passwords and roles. Staff data APIs live under `/api/cms`; the public
submission endpoint is `/api/submissions`. Drafts from earlier chats are not
automatically submitted.

Payload schema changes use additive SQL migrations in `drizzle/`, alongside the
chat migrations. Automatic Payload schema push is disabled to preserve existing
chat tables and indexes. Generate Payload types/import maps with
`bun node_modules/payload/bin.js generate:types --disable-transpile` and
`bun node_modules/payload/bin.js generate:importmap --disable-transpile`.

## Email notifications and passwords

In the staff panel, **Moje ustawienia** opens your account. Administrators can
also configure every account through **Użytkownicy**. Enable **Wysyłaj
powiadomienia e-mail** and set **Adres e-mail do powiadomień** to receive new
resident idea notifications. Both settings are required; the login address is
never used as a fallback. Existing accounts start with notifications disabled.
Contact and innovation-testing submissions do not trigger emails.

Delivery uses the [Resend SDK](https://github.com/resend/resend-node). Configure
these Worker secrets for production (use a sender from a domain verified in Resend):

```sh
bunx wrangler secret put RESEND_API_KEY
bunx wrangler secret put RESEND_FROM_EMAIL
```

For example, the sender can be `AIkonik <powiadomienia@your-domain.pl>`.
Apply `0005_email_notifications.sql` with the usual D1 migration command.
No email is sent during local development, including production previews on
localhost, or when either Resend setting is missing. Notifications run with
Worker `waitUntil` after the idea is saved. Each recipient gets a separate email
linking to the authenticated panel. Repeated submission requests do not trigger
another notification; provider failures are logged without blocking submissions.
Failed deliveries are not automatically retried.

**Zmień hasło** opens a separate form with a new password and confirmation.
CMS users must enter their current password; administrators can reset any
account without it. Passwords must have 8–128 characters. A successful change
revokes all sessions of the affected user. Changing your own password redirects
to login. Save other account settings separately using the normal save button.

## Migrations

Edit `db/schema.ts`, run `bun run db:generate`, commit `drizzle/`, then
`db:migrate:local` / `db:migrate:remote` (CI applies remote on deploy).

## Deploy

Repository: https://github.com/michalwilk123/aikonik. Production runs on the
`aikonik` Worker at https://aikonik.michalwilk139.workers.dev. Its D1 binding
continues to use the existing `hubmi` database, preserving stored data.
The old `hubmi.michalwilk139.workers.dev` address redirects to the new origin,
preserving paths and query strings. `wrangler.redirect.jsonc` manages that redirect.

Pushes to `main` run `.github/workflows/deploy.yml` (checks, build, D1
migrations, deploy). Required GitHub secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`. Set the runtime secret once:
`bunx wrangler secret put OPENROUTER_API_KEY`.
