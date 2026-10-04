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
`/cms` opens the staff dashboard with contact, ideas, testing and grant inboxes.
Workers see **Moje rozmowy** and can read/respond only to their assigned cases.
Administrators see **Wszystkie rozmowy** and **Przypisz klienta do pracownika**;
they assign or reassign each case using **Osoba prowadząca**. Access is enforced
by collection APIs and conversation queries, not just dashboard filters.

The case detail shows the submitted form as the first chat message. Contact
metadata, status, assignment and private notes sit in the sidebar. Submitted
content remains read-only for workers. Public replies display the worker’s
**Imię** and **Nazwisko**; existing accounts can fill their surname in account
settings. Internal chat notes and sidebar notes never appear to the customer.
Workers can edit their own account settings; administration of other accounts
and technical AI chat data remain restricted. Public visitors do not need accounts.
Staff registration and password recovery remain disabled.

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

For a judges' presentation, seed 16 fictional Małopolska cases (four per inbox)
assigned to the existing `cms@hubmi.invalid` account:

```sh
bun run cms:seed:demo
# Deployed Cloudflare database:
bun run cms:seed:demo --remote
```

The demo includes Polish form content, varied statuses, customer/staff replies
and internal notes. People and organisations are fictional; contact emails use
`hubmi.invalid`, and sidebar notes mark every case as demonstration data. The
example grant call is unpublished and closed, so it cannot accept real applications.
Seeding sends no email, creates no users and preserves existing records and
passwords. Re-running preserves edits to demo cases, using fixed demo IDs.

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
These staff alerts are separate from customer conversation notifications.

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

Every submitted contact request, idea, testing form or grant application sends
the customer a private conversation link. Every public staff reply creates a
durable customer notification in the same D1 transaction as its message, then
attempts Resend delivery. Retries reuse the message/provider idempotency key.
Failures remain visible in the CMS chat with **Ponów powiadomienie**; there is no
scheduled retry processor. Internal notes never generate customer email.
The customer replies on the conversation page, not by replying to email.

Email links use seven-day, single-use tokens in the URL fragment; D1 stores only
token hashes. Opening a link creates a seven-day HttpOnly, SameSite session scoped
to that request. Expired/used links can be renewed using the original contact email,
with a generic response and rate limits. Staff access does not depend on customer
links. Conversation records outlive link expiry and grant call closure.

With `DEV=true` under `next dev`, **Kontakt** includes a hardcoded sample chat
link, and submission receipts include a private preview link. These previews send
no email and are unavailable in production. Test in a running local app with
`bun run test:browser:requests`, `bun run test:browser:request-demo` and
`bun run test:browser:grants`; the last script creates and cleans up temporary
local staff accounts, a call and an application.

## Grant calls

Administrators configure **Nabory grantowe** in the CMS: title, rules, publication,
opening/closing times, and questions with help text, required flags and character
limits. `/nabory` lists published calls. `/nabory/[id]` enables its application
generator only between opening (inclusive) and closing (exclusive), showing times
in Europe/Warsaw. Applicants may fill the form themselves or ask AI to suggest
answers; suggestions require explicit acceptance, editing and a separate final
submission. Local DEV previews do not call the model.

Application questions and call rules are snapshotted at submission. Changes to a
call invalidate stale forms; the insert checks the active dates and call version
atomically. A lost receipt can be retried using the saved snapshot after closure.
Grant applications become ordinary staff conversations and use the same assignment
and account-free communication flow. Apply migrations `0006`–`0008` before use.

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

## Shared social innovation library

The CMS **Innowacje społeczne** link opens `/admin/collections/innovations`.
Workers (`cms`) and administrators can read and edit all entries in this shared
library, independently of conversation assignments. Titles, categories,
descriptions, source URLs, videos, additional materials and licence links are
editable. Existing entry IDs and original PDF evidence remain immutable; creating
and deleting entries are disabled. Charts and report data are outside this collection.

Migration `0009_innovations.sql` imports the 115 entries from the versioned ROPS
snapshot once. Apply local/remote D1 migrations before running/deploying this
version. Subsequent CMS edits are authoritative: assistant searches, source cards
and videos read D1, with one library snapshot per answer and fresh data on the
next request. The original catalog remains an import/test fixture and retains the
read-only social challenge map. Re-scraping it does not overwrite CMS edits.
