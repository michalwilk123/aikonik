# Chat streaming, storage and verification

`/asystent` uses the four-agent workspace through the `Chat` component. Both
`POST /api/agents` and `POST /api/chat` use the same streaming runtime. The old
buffered Server Action is retired. Each agent has a separate in-memory opaque
conversation capability. Switching agents preserves its conversation; reloading
creates a new conversation. Existing transcripts remain in D1.

## Run deterministic checks

```sh
bun install
bun run db:migrate:local
bun run test           # pure adapter tests + actual local D1 integration
bunx playwright install chromium
bun run test:e2e       # real browser, synthetic responses; no model credentials
bun run lint
bun run typecheck
bun run knip
```

If another agent already has Next dev running, reuse it without stopping it:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3200 bun run test:e2e
```

CI and deployment gates run pure, D1 and browser tests. They never invoke live
models. D1 integration uses Miniflare/workerd and the actual migrations, batch
admission, persistence adapter and runtime, rather than an in-memory SQL mock.
The fixture database is isolated from `.wrangler` and disposed after the tests.

| Functionality | Deterministic coverage |
| --- | --- |
| History and prompt construction | Real outgoing OpenRouter request: one instruction message, previous user/assistant turns, new message once, whole-turn budgets, no browser data or credentials |
| Streaming | Real provider adapter with an open SSE fixture: readable text arrives before provider completion; structured JSON stays private |
| Report tool | Actual tool invocation, topic validation, approved facts/pages, matched call/result ID, instructions on continuation, final answer after repeated tool calls |
| Canonical persistence | Two message rows per turn, one conversation across turns, writes before publication, atomic admission/finalization, prompt version saved once |
| Retry/concurrency | Existing request replay never invokes a model, changed payload rejected, one running turn across concurrent D1 admissions |
| Failures | Schema/provider failures, missing completion, partial response preservation, cancellation, stale-turn recovery, no fabricated fallback |
| UI | Burst reveal, acceleration/draining, reduced motion, mobile layout and multiline input, stop, prepared messages, inline artifacts, aligned header/chat/composer, scroll-up preservation |
| Agent behavior | Four distinct prompts, source ID allowlist, isolated conversations and artifacts |

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

Copy `.dev.vars.example` to `.dev.vars` and fill `OPENROUTER_API_KEY` for interactive
chat. Apply local migrations before running dev. Production uses the existing
D1 binding and deployment migration step. No remote migration or deployment is
performed by local tests.
