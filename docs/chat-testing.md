# Chat streaming, storage and verification

`/asystent` uses the five-agent workspace through the `Chat` component. Both
`POST /api/agents` and `POST /api/chat` use the same streaming runtime. The old
buffered Server Action is retired. Each agent has a separate in-memory opaque
conversation capability. Switching agents preserves its conversation; reloading
creates a new conversation. Existing transcripts remain in D1.

Assistants „Wiedza” and „Wdrażanie innowacji” can call `show_map` and
`show_bar_chart` to display interactive visualizations directly in their replies.
For example: „Jak wygląda dzietność w woj. małopolskim?” selects indicator 135
and a bar chart comparing Małopolska with Poland. This indicator has no county
map. Indicators with county data support interactive maps using the original
Obserwator boundaries. Data is fetched from the source for the requested year;
omitting the year selects the latest available. The other three assistants have
no visualization tools. Source failures never produce invented chart values.

„Dopasuj” uses the saved innovation catalog, project documentation and social
challenge excerpts to match a problem to a solution. Only this agent attaches
catalog videos. „Wiedza” also reads approved report facts and social challenge
excerpts; it has no project matching or video tools. Both agents have response schemas without artifact creation.
The internal ID `odkrywaj` is retained for „Dopasuj” to preserve stored conversations.

## Run deterministic checks

```sh
bun install
bun run db:migrate:local
bun run test           # pure adapter tests + actual local D1 integration
bun run lint
bun run typecheck
bun run knip
```

CI and deployment gates run pure and D1 tests. They never invoke live
models. D1 integration uses Miniflare/workerd and the actual migrations, batch
admission, persistence adapter and runtime, rather than an in-memory SQL mock.
The fixture database is isolated from `.wrangler` and disposed after the tests.

| Functionality | Deterministic coverage |
| --- | --- |
| History and prompt construction | Real outgoing OpenRouter request: one instruction message, previous user/assistant turns, new message once, whole-turn budgets, no browser data or credentials |
| Streaming | Real provider adapter with an open SSE fixture: readable text arrives before provider completion; structured JSON stays private |
| Report tool | Actual tool invocation, topic validation, approved facts/pages, matched call/result ID, instructions on continuation, final answer after repeated tool calls |
| Observatory tools | Live-source parsing, isolated cookies, requested years, map/bar tool calls, assistant restrictions, persisted charts and replay |
| Canonical persistence | Two message rows per turn, one conversation across turns, writes before publication, atomic admission/finalization, prompt version saved once |
| Retry/concurrency | Existing request replay never invokes a model, changed payload rejected, one running turn across concurrent D1 admissions |
| Failures | Schema/provider failures, missing completion, partial response preservation, cancellation, stale-turn recovery, no fabricated fallback |
| Text reveal | Burst reveal, acceleration/draining, reduced motion and grapheme boundaries |
| Agent behavior | Per-agent executable tool registries, forbidden calls recorded without execution, role-specific output schemas, isolated history and artifacts |

## Submission forms in the browser

„Dodaj pomysł” and „Testuj innowacje” collect missing basics with suggested
answers. Their artifacts use `ready: false` during the interview and
`ready: true` when a useful first draft can be reviewed. Readiness does not depend
on question marks or a minimum number of turns.

The ready draft opens an editable HTML form with „Dalej” and „Anuluj”. „Dalej”
opens first name, surname and email fields with „Wstecz” and „Wyślij”. Chat stays
disabled through both steps and submission retries. Cancelling hides the form
and enables chat; successful submission shows a receipt and also enables chat.
Edits and contact fields survive going back or switching agents. The backend
checks conversation ownership and the latest draft's title and field labels,
then saves the edited values. Saved submissions remain immutable.

With `bun dev` running in another terminal:

```sh
bunx playwright-core install chromium
bun run test:browser
# For a different local port:
TEST_BASE_URL=http://localhost:3001 bun run test:browser
```

The browser check runs both assistants with intercepted AI and submission
responses, without model calls or writing to the local database. It covers the
interview, editing, back, tab switching, failed submission/retry, send and cancel.
Real D1 integration tests separately verify saving edited fields, ownership,
stale drafts and immutable retries.

## Opt-in live evaluation

Provide `OPENROUTER_API_KEY` as an environment variable and run:

```sh
bun run eval:openrouter
# Optional: repeat without concealing failures behind retries.
EVAL_REPEATS=3 EVAL_MAX_CALLS=36 bun run eval:openrouter
```

This explicitly sends synthetic scenarios to Gemini 3.1 Flash Lite on OpenRouter.
It uses the production streaming adapter/runtime and a disposable real D1 database.
Cases cover location memory, actual report-tool execution and citations, ordinary
advice, Canvas creation/correction, pilot planning and institutional adaptation.
Checks inspect schema, database rows, actual tool calls and artifacts; prose checks
are intentionally approximate. Every attempt is reported, including failures.

There are no automatic retries or model fallbacks. The harness caps provider
requests (12 by default, up to 36) and each call has the production 4,000-output-token
limit. The request ceiling bounds volume, not a dollar spend guarantee; provider
pricing is external. Results contain prompt hashes, model settings, token usage,
latency and checks in ignored `evals/results/*.json`. No real transcripts or API
key are written to reports. Live results are evidence about a particular run and
never replace deterministic functionality tests.

## D1 contract

- `conversations`: capability digest, agent identity and browser metadata once.
- `messages`: one user and one assistant row per accepted turn. Text updates the
  existing assistant row. Partial interrupted/error output remains saved.
- `turns`: ordering, lifecycle, time to first text, total time, normalized error
  code/type and provider HTTP status when available.
- `model_calls`: every model step, model/provider, usage, time to first output,
  response time, finish reason and context message references; no prompt copies.
- `tool_calls`: arguments, validated result, duration and outcome.
- `prompt_versions`: immutable instructions saved once by hash, referenced by turns.

Accepted inputs and the assistant placeholder are persisted before generation.
Every public text update is saved before emission; completion is emitted only
when canonical output and terminal metrics are committed. A crash can leave a
running turn; the next admission marks it interrupted after the 45-second lease.
Capability checks and the unique running-turn index enforce ownership and prevent
cross-request overlap. D1 failure prevents acceptance or successful completion.

The UI has a separate received/displayed text buffer inspired by Aiwise. Network
chunks can arrive unevenly; animation drains smoothly on an independent frame
clock, catches up on larger backlogs and respects reduced motion. Presentation
state and UI errors never enter model history. Source metadata and browser logs
are omitted from historical prompts; latest artifacts and useful offer fields
remain available. Context is bounded to 24,000 characters and 20 messages by
removing complete oldest turns, while D1 keeps the full transcript.

## Local and production setup

Copy `.dev.vars.example` to `.dev.vars`. `DEV=true` enables hardcoded previews of
all five agents without AI calls. For model responses, set `DEV=false` and fill
`OPENROUTER_API_KEY`. Apply local migrations before running `bun dev`. Production uses the existing
D1 binding and deployment migration step. No remote migration or deployment is
performed by local tests.
