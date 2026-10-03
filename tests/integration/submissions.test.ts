import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { manualDraft } from "@/agents/submission-template";
import type { ChatAgent } from "@/application/chat/runtime";
import { startTurn } from "@/application/chat/runtime";
import { ChatConflict } from "@/domain/chat/types";
import { submissionInputSchema } from "@/domain/submissions/input";
import { insertSubmission } from "@/infrastructure/cms/submissions";
import { verifyAgentSubmission } from "@/infrastructure/submissions/agent";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
before(async () => {
  fixture = await testDatabase();
});
after(async () => {
  await fixture?.dispose();
});
const artifact = {
  title: "Mój Social Canvas",
  fields: [{ label: "Odbiorcy", value: "Seniorzy" }],
};
// The form a user sends: every template field plus the draft, all filled in.
const form = (source: "dodaj-pomysl" | "testuj-innowacje") => {
  const draft = manualDraft(source, artifact);
  return {
    ...draft,
    fields: draft.fields.map((field) => ({
      ...field,
      value: field.value || "Do ustalenia",
    })),
  };
};
const agent: ChatAgent = async function* () {
  yield {
    type: "answer",
    answer: {
      message: "Gotowy szkic",
      areaLabel: "Małopolska",
      offers: [],
      artifact,
    },
  };
};
async function conversation(
  source: "dodaj-pomysl" | "testuj-innowacje" = "dodaj-pomysl",
) {
  const identity = {
    conversationId: crypto.randomUUID(),
    capability: crypto.randomUUID(),
  };
  const requestId = crypto.randomUUID();
  const events = await startTurn(
    fixture.store,
    agent,
    { ...identity, requestId, agentId: source, text: "Pomoc seniorom" },
    {},
    new AbortController().signal,
  );
  for await (const _ of events) {
    /* Persist the complete answer. */
  }
  return {
    id: crypto.randomUUID(),
    source,
    ...identity,
    requestId,
    name: "Anna",
    surname: "Kowalska",
    email: "anna@example.pl",
    consent: true as const,
    artifact: form(source),
  };
}

test("contact submissions require validated contact information without a consent field", () => {
  const contact = {
    id: crypto.randomUUID(),
    source: "contact",
    name: "Anna",
    email: "anna@example.pl",
    subject: "Inny temat",
    message: "Dzień dobry",
  };
  assert.equal(submissionInputSchema.safeParse(contact).success, true);
  assert.equal(
    submissionInputSchema.safeParse({ ...contact, email: "not-an-email" })
      .success,
    false,
  );
  assert.equal(
    submissionInputSchema.safeParse({ ...contact, message: " " }).success,
    false,
  );
  assert.equal(
    submissionInputSchema.safeParse({ ...contact, subject: "arbitrary topic" })
      .success,
    false,
  );
});

test("every template field must be filled in", async () => {
  const input = await conversation();
  const db = fixture.db as unknown as D1Database;
  const [first, ...rest] = input.artifact.fields;
  for (const fields of [
    rest,
    [{ ...first, value: " " }, ...rest],
    [first, first, ...rest],
  ])
    await assert.rejects(
      verifyAgentSubmission(db, {
        ...input,
        artifact: { ...input.artifact, fields },
      }),
      (error) => error instanceof ChatConflict && error.status === 409,
    );
});

test("a form filled in before the first reply is saved without a conversation", async () => {
  const db = fixture.db as unknown as D1Database;
  const { conversationId, capability, requestId, ...input } =
    await conversation("testuj-innowacje");
  const filled = {
    ...input,
    artifact: {
      title: "Plan testu innowacji",
      fields: manualDraft("testuj-innowacje", null).fields.map((field) => ({
        ...field,
        value: "Do ustalenia",
      })),
    },
  };
  assert.equal(submissionInputSchema.safeParse(filled).success, true);
  assert.equal(
    submissionInputSchema.safeParse({ ...filled, conversationId }).success,
    false,
  );
  assert.deepEqual(await verifyAgentSubmission(db, filled), filled.artifact);
  await assert.rejects(
    verifyAgentSubmission(db, {
      ...filled,
      artifact: { ...filled.artifact, fields: input.artifact.fields },
    }),
    (error) => error instanceof ChatConflict && error.status === 409,
  );
});

test("only the conversation owner can submit fields from the latest agent draft", async () => {
  const input = await conversation();
  assert.equal(submissionInputSchema.safeParse(input).success, true);
  assert.equal(
    submissionInputSchema.safeParse({ ...input, consent: false }).success,
    false,
  );
  assert.deepEqual(
    await verifyAgentSubmission(fixture.db as unknown as D1Database, input),
    input.artifact,
  );
  await assert.rejects(
    verifyAgentSubmission(fixture.db as unknown as D1Database, {
      ...input,
      capability: crypto.randomUUID(),
    }),
    (error) => error instanceof ChatConflict && error.status === 403,
  );
  await assert.rejects(
    verifyAgentSubmission(fixture.db as unknown as D1Database, {
      ...input,
      source: "testuj-innowacje",
    }),
    (error) => error instanceof ChatConflict && error.status === 403,
  );
  await assert.rejects(
    verifyAgentSubmission(fixture.db as unknown as D1Database, {
      ...input,
      artifact: { ...artifact, title: "Changed title" },
    }),
    (error) => error instanceof ChatConflict && error.status === 409,
  );
  await assert.rejects(
    verifyAgentSubmission(fixture.db as unknown as D1Database, {
      ...input,
      artifact: {
        ...artifact,
        fields: [{ label: "Inne pole", value: "Seniorzy" }],
      },
    }),
    (error) => error instanceof ChatConflict && error.status === 409,
  );
  assert.equal(
    submissionInputSchema.safeParse({ ...input, surname: " " }).success,
    false,
  );
});

test("newer or running turns invalidate an earlier displayed draft", async () => {
  const input = await conversation();
  await fixture.store.accept(
    {
      conversationId: input.conversationId,
      capability: input.capability,
      requestId: crypto.randomUUID(),
      agentId: input.source,
      text: "Popraw szkic",
    },
    {},
  );
  await assert.rejects(
    verifyAgentSubmission(fixture.db as unknown as D1Database, input),
    (error) => error instanceof ChatConflict && error.status === 409,
  );
});

test("immutable submission retries produce one receipt and reject altered payloads", async () => {
  const input = await conversation();
  const saved = {
    id: input.id,
    source: input.source,
    name: input.name,
    email: input.email,
    subject: artifact.title,
    artifact,
    conversationId: input.conversationId,
    sourceTurnId: input.requestId,
  };
  const db = fixture.db as unknown as D1Database;
  const results = await Promise.all([
    insertSubmission(db, saved),
    insertSubmission(db, saved),
  ]);
  assert.deepEqual(results, [{ id: input.id }, { id: input.id }]);
  assert.equal(
    await fixture.db
      .prepare("SELECT count(*) FROM submissions WHERE source_turn_id = ?")
      .bind(input.requestId)
      .first("count(*)"),
    1,
  );
  const row = await fixture.db
    .prepare(
      "SELECT artifact, details, status, assigned_to_id, internal_notes FROM submissions WHERE id = ?",
    )
    .bind(input.id)
    .first<{
      artifact: string;
      details: string;
      status: string;
      assigned_to_id: number | null;
      internal_notes: string | null;
    }>();
  assert.deepEqual(JSON.parse(row?.artifact ?? "null"), artifact);
  assert.match(row?.details ?? "", /Odbiorcy\nSeniorzy/);
  assert.equal(row?.status, "new");
  assert.equal(row?.assigned_to_id, null);
  assert.equal(row?.internal_notes, null);
  await assert.rejects(
    insertSubmission(db, { ...saved, name: "Changed name" }),
    (error) => error instanceof ChatConflict && error.status === 409,
  );
  await fixture.store.accept(
    {
      conversationId: input.conversationId,
      capability: input.capability,
      requestId: crypto.randomUUID(),
      agentId: input.source,
      text: "Nowa wersja",
    },
    {},
  );
  assert.deepEqual(await verifyAgentSubmission(db, input), input.artifact);
  assert.deepEqual(await insertSubmission(db, saved), { id: input.id });
});

test("a new turn between verification and insertion prevents saving a stale draft", async () => {
  const input = await conversation();
  const db = fixture.db as unknown as D1Database;
  await verifyAgentSubmission(db, input);
  await fixture.store.accept(
    {
      conversationId: input.conversationId,
      capability: input.capability,
      requestId: crypto.randomUUID(),
      agentId: input.source,
      text: "Nowa wersja",
    },
    {},
  );
  await assert.rejects(
    insertSubmission(db, {
      id: input.id,
      source: input.source,
      name: input.name,
      email: input.email,
      subject: artifact.title,
      artifact,
      conversationId: input.conversationId,
      sourceTurnId: input.requestId,
    }),
    (error) => error instanceof ChatConflict && error.status === 409,
  );
  assert.equal(
    await fixture.db
      .prepare("SELECT count(*) FROM submissions WHERE id = ?")
      .bind(input.id)
      .first("count(*)"),
    0,
  );
});

test("Testuj innowacje submissions use the same owned immutable snapshot flow", async () => {
  const input = await conversation("testuj-innowacje");
  const db = fixture.db as unknown as D1Database;
  assert.deepEqual(await verifyAgentSubmission(db, input), input.artifact);
  assert.deepEqual(
    await insertSubmission(db, {
      id: input.id,
      source: input.source,
      name: input.name,
      email: input.email,
      subject: artifact.title,
      artifact,
      conversationId: input.conversationId,
      sourceTurnId: input.requestId,
    }),
    { id: input.id },
  );
  assert.equal(
    await fixture.db
      .prepare("SELECT source FROM submissions WHERE id = ?")
      .bind(input.id)
      .first("source"),
    "testuj-innowacje",
  );
});

for (const source of ["dodaj-pomysl", "testuj-innowacje"] as const) {
  test(`${source} saves the user's edited draft values`, async () => {
    const input = await conversation(source);
    const edited = {
      ...input.artifact,
      fields: input.artifact.fields.map((field) =>
        field.label === "Odbiorcy"
          ? { ...field, value: "Rodziny z dziećmi" }
          : field,
      ),
    };
    const db = fixture.db as unknown as D1Database;
    const verified = await verifyAgentSubmission(db, {
      ...input,
      artifact: edited,
    });
    assert.deepEqual(verified, edited);
    await insertSubmission(db, {
      id: input.id,
      source,
      name: input.name,
      email: input.email,
      subject: verified.title,
      artifact: verified,
      conversationId: input.conversationId,
      sourceTurnId: input.requestId,
    });
    const saved = await fixture.db
      .prepare("SELECT artifact FROM submissions WHERE id = ?")
      .bind(input.id)
      .first<string>("artifact");
    assert.deepEqual(JSON.parse(saved ?? "null"), edited);
    assert.deepEqual(
      await verifyAgentSubmission(db, { ...input, artifact: edited }),
      edited,
    );
    await assert.rejects(
      insertSubmission(db, {
        id: input.id,
        source,
        name: input.name,
        email: input.email,
        subject: artifact.title,
        artifact,
        conversationId: input.conversationId,
        sourceTurnId: input.requestId,
      }),
      (error) => error instanceof ChatConflict && error.status === 409,
    );
  });
}
