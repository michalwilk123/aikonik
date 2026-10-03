# Social Innovation Canvas field map and dialogue contract

Source: [INNO AGH Social Innovation Canvas](https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf), fetched 2026-10-03. The three pages were extracted and visually checked. Source footer: version 1.0, 5 May 2026, adapted from The New Global School. Local reference: [social-canvas-source.pdf](./social-canvas-source.pdf). SHA-256: `ae38f539b484a4c40ed91aced94847bbf09673634f1a382b7c177ad27a0dc8c0`.

The PDF is a three-page visual worksheet, not an interactive PDF form. Use a versioned application schema, with Polish labels and explicit mapping to worksheet locations. The map below summarizes worksheet structure; identifiers, validation and dialogue behavior are proposed Hubmi design.

## Page 1

| Worksheet block | Application slots | Representation |
| --- | --- | --- |
| PROBLEM | `problem.intensity`, `problem.frequency`, `problem.scale` | Three independent four-level selections |
| AKTORZY ZMIANY | `actors.supporters`, `actors.obstacles` | Separate lists of people/groups/institutions, optional reason/role |
| ROZWIĄZANIE | `solution.valueCost`, `solution.readiness`, `solution.clarity` | Three independent four-level selections |
| STRUKTURA KOSZTÓW | `costs.fixed`, `costs.variable` | Multiple checklist selections plus custom entries |

Selection meanings, from lowest to highest:

- Intensity: mild annoyance; obstructed activity; significant recurring obstruction; severe harm/exclusion/stress.
- Frequency: rare; occasional; regular/weekly; daily or almost daily.
- Scale: individuals; a specific small community; a large regional/sector group; broad society/multiple communities.
- Value versus cost: cost exceeds benefit; similar cost and benefit; benefit exceeds cost; high benefit with low entry barriers.
- Readiness: concept; prototype; tested with real users; ready for implementation with known resources.
- Clarity: unclear; partially understood; clearly understood; target users can explain it themselves.

For implementation, the exact visible selection labels (in source order) are:

| Slot | Source labels |
| --- | --- |
| Intensity | Bardzo poważny problem; Mocno przeszkadza; Utrudnia działanie; Lekko przeszkadza |
| Frequency | Bardzo często; Często; Czasami; Rzadko |
| Scale | Pojedyncze osoby; Wąska grupa; Duża grupa; Bardzo szeroka grupa |
| Value/cost | Koszt jest większy niż korzyść; Korzyść i koszt są podobne; Korzyść jest większa niż koszt; Bardzo duża wartość przy małym koszcie |
| Readiness | Pomysł; Prototyp; Przetestowane rozwiązanie; Gotowe do wdrożenia |
| Clarity | Rozwiązanie jest niejasne; Rozwiązanie jest częściowo jasne; Rozwiązanie jest jasne; Ludzie potrafią wyjaśnić sami |

Fixed and variable costs have predefined examples and free additions. Selection alone does not supply a monetary amount; amounts, currency, period and estimates are optional application extensions, never inferred facts. Clarity is visually shared beneath the actors/solution columns: it describes the solution, not actor willingness.

## Page 2

| Worksheet block | Application slots | Representation |
| --- | --- | --- |
| ODBIORCY | `audience.users`, `audience.payers`, `audience.decisionMakers` | Three distinct multi-select/custom lists |
| Źródła dochodów | `income.primary.stage`, `income.primary.description`, `income.growth.stage`, `income.growth.description` | Two separate four-level selections and two free-text areas |
| PROPOZYCJA WARTOŚCI | `value.emotional`, `value.functional` | Two multi-select/custom lists, maximum three entries each |

Primary income stages distinguish unknown funding, an untested idea, a concrete offer and actual payment/funding willingness. Growth stages distinguish no additional source, untested additional ideas, practical expansion paths and a repeatable funding/sales model. They must not be conflated with solution readiness.

Primary stage labels: Nie wiemy jeszcze; Mamy pomysł; Mamy konkretną propozycję; Mamy potwierdzenie. Growth stage labels: Brak jasnych dodatkowych źródeł; Są szanse na dodatkowe pieniądze; Widzimy realne ścieżki rozwoju; Nasz model działania można powielać.

Recipients, payers and decision makers are different roles even when one entity fills several. Emotional value describes feelings and wellbeing; functional value describes practical improvements. The worksheet asks for at most two to three priorities in each value list: enforce a maximum of three, permit fewer, and ask the user to prioritize rather than silently discard items.

## Page 3

| Worksheet block | Application slots | Representation |
| --- | --- | --- |
| Kanały | `channels.direct`, `channels.intermediary`, `channels.additional` | Three multi-select/custom lists |
| Konstelacja partnerów | `partners[]` | Entity, contribution(s), applicable area(s), relationship status |
| Wpływ | `impact.person`, `impact.community`, `impact.environment` | Three independent four-level selections |

Partner areas: reducing costs, reaching recipients, improving value. A single partner may contribute in multiple areas; store it once with several contributions. Relationship statuses distinguish potential, in discussion and confirmed. Presence in a suggestion does not establish a partnership.

Impact levels distinguish small/unclear, plausible but unconfirmed, concrete observable and strong confirmed change. The worksheet is a three-column matrix; do not flatten it into one aggregate impact rating. Evidence notes are an application addition needed to support claims of confirmed impact.

Impact labels: Mały wpływ; Możliwy wpływ; Wyraźny wpływ; Silny wpływ. Partner-status labels: Potwierdzony partner; Partner, z którym rozmawiacie; Potencjalny partner.

Source quirk: both the direct-channel and intermediary-channel sections print the same heading, `BEZPOŚREDNIE`; the second section's question and examples concern intermediaries. Keep the source-location mapping, but use an unambiguous UI label and stable `intermediary` ID. The PDF has checklist/free-text additions; it does not define numeric budgets, impact metrics or a separate idea-summary field. A short idea/problem summary is useful application context and should be identified as an extension.

## Natural-language filling and revisions

Maintain one canonical canvas per current conversation, with schema version, integer revision and field-level provenance. A slot has `value`, `status`, `sourceMessageIds` and optional `evidenceNote`. Useful statuses are `missing`, `unknown`, `proposed`, `accepted` and `conflicted`; `unknown` represents an explicit user answer and must not be treated as a missing value. Confidence must not be presented as an objective probability.

The creator extracts a proposed patch from each utterance rather than replacing the full canvas. One message may fill several slots. The application validates every patch against allowed paths, enums, cardinality and current revision before applying it. Explicit user statements can be accepted as user-provided facts; inferred classifications and model-generated ideas stay visibly proposed until accepted. Evidence references must resolve to actual user messages. Instructions embedded in answers cannot add capabilities or change schema rules.

Use typed operations such as `set`, `addItem`, `updateItem`, `removeItem`, `clear` and `markUnknown`. List members need stable IDs so corrections do not duplicate a recipient or partner. Deduplication must not collapse distinct roles or merge different organizations simply because their names resemble one another. Clearing a field differs from saying its value is unknown.

Ask one focused follow-up at a time, prioritizing contradictions and missing dependencies before lower-value details. Begin with problem, users and proposed solution; then distinguish payers/decision makers, value, practical resources and delivery, partners and impact. This sequence is a product recommendation, not a prescribed order in the PDF. Do not force the user into a form-by-form interview when their narrative already covers several fields. Offer a short summary of what was filled and allow users to defer unanswered areas.

If a new statement conflicts with an accepted value, retain the existing value and show the proposed correction for resolution unless the user explicitly identifies a correction. An explicit correction can revise the field with provenance. Revisions increment the canvas revision, preserve a small audit event and invalidate an earlier final confirmation. Client requests with stale revisions return a conflict and refresh the current state; they must not overwrite newer content.

## Final confirmation component contract

The server emits a typed `canvas-review` component with `{canvasId, schemaVersion, revision, sections, unresolvedFields, proposedFields, confirmationToken}`. `sections` are application-rendered schema data; the model cannot supply executable HTML or arbitrary component names. Each field offers accept/edit/mark-unknown actions, keyboard access and an accessible status label. Show all pages' sections in a readable summary and distinguish incomplete fields from explicit unknowns.

Only a deliberate user action confirms the reviewed revision. The confirm request includes canvas ID, revision, one-time confirmation token and idempotency key. The server verifies session ownership, version/revision, unresolved proposals and token scope, then records confirmation once. Confirmation with explicit unknowns may be permitted under a documented product rule; contradictions and unresolved proposed values should prevent final confirmation. Exact behavior for an unfinished draft is a product decision.

The user confirmed that the final button submits the reviewed canvas into the ROPS admin inbox. Its label and explanation must state that consequence. Commit the immutable confirmed snapshot and inbox submission atomically, and show a receipt only after persistence succeeds. This does not imply email delivery or a grant application. If the user edits later, the current canvas returns to draft and must be reviewed again; the already submitted snapshot stays unchanged. A download/export action, if added, consumes confirmed schema data and is tested separately. Because the source PDF has no form fields, producing a filled facsimile would require explicit rendering/overlay mapping; a legible Hubmi report is a separate output format.

## Functionality tests

- A Polish narrative fills several appropriate slots and preserves evidence references; no other slot changes.
- Beneficiary/payer/decision-maker roles remain separate, even for the same institution.
- Each rating accepts only its own enum; readiness cannot become income confirmation or strong impact.
- Four emotional/functional values trigger prioritization, not truncation; custom entries count toward the same maximum.
- One partner with two contribution areas remains one entity; a suggested partner stays potential.
- A user correction updates the targeted stable item, increments revision and invalidates prior confirmation.
- Missing, unknown, proposed and conflicted fields render differently and have distinct completion behavior.
- Fabricated evidence IDs, unknown paths, injected component HTML and stale-revision patches are rejected.
- Confirmation occurs only from the user action, is bound to the displayed revision and is idempotent.
- A changed-payload replay, another session's canvas, unresolved contradiction or changed revision cannot confirm. An identical retry of an already successful request returns the existing receipt without another submission, even though its confirmation token has been consumed.
- Internal reconstruction from D1 preserves accepted/proposed states and the review summary. Browser reload starts a fresh conversation, as required; it does not restore the previous canvas.
- A failed snapshot/inbox commit produces no success receipt or partial submission; an identical successful retry creates only one inbox entry.
- Model evaluations use the actual creator runtime with fixture messages and disposable persistence. Assess extraction coverage, unnecessary follow-ups, correct uncertainty and revision handling; do not assert identical wording. Production privacy rules apply independently of synthetic evaluation transport.
