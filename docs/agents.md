# Four-agent starter

The assistant at `/asystent` renders `agents/workspace.tsx`. The landing page is maintained separately. The chat shell now uses the shared
streaming runtime and D1 persistence described in [chat testing](chat-testing.md).

| Agent directory | Color | Starter behavior |
| --- | --- | --- |
| `agents/odkrywaj/` | Teal | Read-only lexical retrieval over five verified ROPS report excerpts, with source pages and dates |
| `agents/dodaj-pomysl/` | Purple | One-question interview and a growing working Social Canvas |
| `agents/testuj-innowacje/` | Amber | Pilot hypotheses, success measures, feedback and improvements |
| `agents/wdrazanie-innowacji/` | Rose | Middleman: adapt an innovation to an institution's service, resources and partners |

Each directory owns its prompt and knowledge. `registry.ts` contains the navigation
copy and colors. Agent guidance appears below the welcome title; generated
artifacts appear inline with their assistant response. Model responses cannot
create executable components or render arbitrary HTML.

## Chat and attribution

Each agent has independent messages, draft input, responses, generated artifact,
loading state and request cancellation. Switching agents preserves these states
until a page reload. Nothing is copied between agents automatically.

Every user/assistant message has an `agentId`, UUID and timestamp. Each response
also has its request ID, model, trusted source records and optional artifact.
Artifacts are associated with the assistant response that produced them.

`POST /api/agents` accepts the latest message, agent ID, conversation capability
and stable request ID. It shares D1 admission/history, streaming, validation and
telemetry with `/api/chat`; client-supplied transcripts are rejected. Set
`OPENROUTER_API_KEY` in `.dev.vars` for local development. Missing credentials
and generation failures are saved and shown explicitly. There is no canned
fallback. Requests have a 30-second server deadline and a 45-second browser
deadline. Text streams during generation, with a separate smooth reveal buffer;
sources and artifacts are exposed after final validation.
Generation allows up to three model steps, with the final step reserved for an
answer without tools so repeated report reads cannot exhaust the entire budget.

The model only selects source IDs; source links are resolved against the selected
agent's supplied knowledge. Odkrywaj has no tools that write data and its artifact
is always discarded. The retrieval sample is one report, **not** the complete ROPS
catalog or a current directory of available services.

## Next steps

The UI keeps current conversations in browser memory; accepted transcripts and
diagnostics are saved to D1, independently for each agent. No application, tester registration or partner message is sent. Canvas
fields and plans are provisional model-generated summaries, not validated form
submissions. To extend the prototype, add field-level Canvas provenance and review, expand the vetted ROPS corpus, and add a verified innovation library for
matching existing solutions.

Sources and methodology: [discovery](research/discovery-sources.md),
[Canvas field map](research/social-canvas-fields.md),
[testing and rollout](research/testing-and-rollout.md).

Validation: `bun run test:pure`, `bun run typecheck`, and
`bunx biome check agents app/api/agents app/asystent/page.tsx tests/pure/agent-isolation.test.ts`.
