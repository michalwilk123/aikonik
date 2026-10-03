# Five-agent assistant

Each assistant has a shareable URL: `/asystent/dopasuj`, `/asystent/wiedza`,
`/asystent/dodaj-pomysl`, `/asystent/testuj-innowacje` and
`/asystent/wdrazanie-innowacji`. Switching tabs updates the URL; browser back/forward
restores the selected tab. `/asystent` opens Dopasuj and legacy `?agent=<id>` links
redirect to the corresponding path. The shared assistant layout renders
`agents/workspace.tsx` and preserves conversations across tab navigation.
The landing page is maintained separately. The chat shell now uses the shared
streaming runtime and D1 persistence described in [chat testing](chat-testing.md).

| Agent directory | Tab | Behavior |
| --- | --- | --- |
| `agents/odkrywaj/` | Dopasuj | Understand the user's problem, search saved ROPS innovations, read project evidence and show cited catalog videos |
| `agents/wiedza/` | Wiedza | Find facts in ROPS reports and social challenge excerpts, read statistics and display maps/charts |
| `agents/dodaj-pomysl/` | Dodaj pomysł | One-question interview and a growing working Social Canvas |
| `agents/testuj-innowacje/` | Testuj innowacje | Pilot hypotheses, success measures, feedback and improvements |
| `agents/wdrazanie-innowacji/` | Wdrażanie innowacji | Read the shared ROPS innovation catalog and documentation, show cited videos and adapt a selected innovation into an institutional service brief |

Dopasuj and Wdrażanie innowacji share the saved ROPS innovation catalog and its
search/document tools. Wdrażanie reads the selected project's evidence and prepares
a service brief covering adaptations, delivery, resources, responsibilities, costs
to establish, a pilot and next steps. It retains that brief and catalog citations
in its own conversation. Only Wiedza displays statistical charts and maps.

Each directory owns its prompt and knowledge. `registry.ts` contains the navigation
copy and colors. Welcome screens contain introductory copy and example questions;
generated artifacts appear inline with their assistant response. Model responses cannot
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
fallback in normal mode. Requests have a 30-second server deadline and a 45-second browser
deadline. Text streams during generation, with a separate smooth reveal buffer;
sources and artifacts are exposed after final validation.
Generation allows up to three model steps, with the final step reserved for an
answer without tools so repeated report reads cannot exhaust the entire budget.

The model only selects source IDs; source links are resolved against the selected
agent's supplied knowledge and sources returned by its allowed tools. Dopasuj and
Wiedza use response schemas without an artifact field. Their API replies normalize
artifacts to null for the shared transport contract. Dopasuj retains the internal
`odkrywaj` ID for existing conversations; Wiedza has its own `wiedza` ID and history.
Only Dopasuj attaches innovation videos. Wiedza and Wdrażanie innowacji can show
statistics using Observatory tools. Saved project documentation does not establish
current enrollment or local service availability.

## Agent configuration and execution

Each `agents/<role>/config.ts` owns its prompt, knowledge, model output schema,
history projection and executable tool factory. The shared runtime consumes that
configuration; role permissions are not prompt instructions. Tool functions are
only registered when that role's factory includes them. An unknown or disallowed
call produces a recorded error without invoking any implementation.

| Agent | Executable tools | Structured draft |
| --- | --- | --- |
| Dopasuj | `search_innovations`, `read_innovation`, `read_social_challenges` | None |
| Wiedza | `read_report`, `read_social_challenges`, `show_map`, `show_bar_chart` | None |
| Dodaj pomysł | None | Social Canvas |
| Testuj innowacje | None | Pilot plan |
| Wdrażanie innowacji | `read_report`, `show_map`, `show_bar_chart` | Adaptation plan |

Read-only agents do not receive historical artifacts or a draft creation schema.
Dopasuj retains internal evidence identifiers to select verified project videos,
and its UI renders the sources section alongside Wiedza and Wdrażanie innowacji.
Dodaj pomysł and Testuj innowacje do not display a sources section. Tests inspect actual provider
requests and deliberately return forbidden tool calls to verify non-execution.

## Local previews without AI

Set `DEV=true` in `.dev.vars` and run `bun dev`. The assistant shows preview
buttons in each tab: catalog video, map, bar chart, Social Canvas with its
submission form, pilot plan and adaptation plan. Any chat message receives a
hardcoded reply. Map and chart values are explicitly fictional; videos and report
excerpts come from the saved catalog. No AI credentials or statistics-service
requests are needed. The existing streaming and local D1 persistence remain active,
including submission validation and saving. The Canvas form is available after the
first preview reply, without completing the usual interview.

Set `DEV=false` and restart to use the model again. Production always ignores
the flag. YouTube playback still needs access to YouTube.

## Next steps

The UI keeps current conversations in browser memory; accepted transcripts and
diagnostics are saved to D1, independently for each agent. No application, tester registration or partner message is sent. Canvas
fields and plans are provisional model-generated summaries, not validated form
submissions. To extend the prototype, add field-level Canvas provenance and review, expand the vetted ROPS corpus and keep the saved innovation library current.

Sources and methodology: [discovery](research/discovery-sources.md),
[Canvas field map](research/social-canvas-fields.md),
[testing and rollout](research/testing-and-rollout.md).

Validation: `bun run test:pure`, `bun run typecheck`, and
`bunx biome check agents app/api/agents 'app/(public)/asystent/page.tsx' tests/pure/agent-isolation.test.ts`.
