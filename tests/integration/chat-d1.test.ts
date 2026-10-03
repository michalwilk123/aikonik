import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { type ChatAgent, startTurn } from "@/application/chat/runtime";
import { ChatConflict, type SendTurn } from "@/domain/chat/types";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
before(async () => {
  fixture = await testDatabase();
});
beforeEach(async () => {
  await fixture.db.batch(
    [
      "model_calls",
      "tool_calls",
      "messages",
      "turns",
      "conversations",
      "prompt_versions",
    ].map((table) => fixture.db.prepare(`DELETE FROM ${table}`)),
  );
});
after(async () => {
  await fixture?.dispose();
});
async function freshDatabase() {
  return { db: fixture.db, store: fixture.store, dispose: async () => {} };
}

const answer = { message: "Pomoc w Tarnowie", areaLabel: "Tarnów", offers: [] };
const input = (): SendTurn => ({
  conversationId: crypto.randomUUID(),
  capability: crypto.randomUUID(),
  requestId: crypto.randomUUID(),
  text: "Mieszkam w Tarnowie",
});
const signal = () => new AbortController().signal;
const agent: ChatAgent = async function* () {
  yield { type: "text", text: "Pomoc" };
  yield { type: "text", text: answer.message };
  yield {
    type: "model",
    step: 0,
    model: "fixture",
    usage: { input: 12, output: 8 },
    durationMs: 10,
    finishReason: "stop",
  };
  yield {
    type: "tool",
    id: "call-0",
    name: "read_report",
    input: { topic: "opieka" },
    output: { facts: [] },
  };
  yield { type: "answer", answer };
};
async function drain(events: Awaited<ReturnType<typeof startTurn>>) {
  const all = [];
  for await (const event of events) all.push(event);
  return all;
}

test("D1 saves each message once, persists before publication, carries history and logs timing/browser/tool data", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = input();
    const events = await startTurn(
      store,
      agent,
      first,
      { userAgent: "Fixture browser", timezone: "Europe/Warsaw" },
      signal(),
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      2,
    );
    for await (const event of events) {
      if (event.type === "text")
        assert.equal(
          await db
            .prepare("SELECT content FROM messages WHERE role = 'assistant'")
            .first("content"),
          event.text,
        );
      if (event.type === "complete")
        assert.equal(
          await db.prepare("SELECT status FROM turns").first("status"),
          "complete",
        );
    }
    const second = {
      ...first,
      requestId: crypto.randomUUID(),
      text: "A dla mamy?",
    };
    let sawHistory = false;
    const checking: ChatAgent = async function* (history, abort) {
      assert.deepEqual(
        history.map((m) => m.role),
        ["user", "assistant", "user"],
      );
      assert.equal(history[0].content, first.text);
      assert.equal(JSON.parse(history[1].content).message, answer.message);
      assert.equal(history[2].content, second.text);
      assert.ok(!JSON.stringify(history).includes("Fixture browser"));
      sawHistory = true;
      yield* agent(history, abort);
    };
    await drain(
      await startTurn(
        store,
        checking,
        second,
        { userAgent: "changed" },
        signal(),
      ),
    );
    assert.ok(sawHistory);
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM conversations").first("n"),
      1,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      4,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM prompt_versions").first("n"),
      1,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM model_calls").first("n"),
      2,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM tool_calls").first("n"),
      2,
    );
    const metrics = await db
      .prepare(
        "SELECT first_text_ms, duration_ms, error_code FROM turns LIMIT 1",
      )
      .first();
    assert.equal(typeof metrics?.first_text_ms, "number");
    assert.equal(typeof metrics?.duration_ms, "number");
    assert.equal(metrics?.error_code, null);
    assert.match(
      String(
        await db.prepare("SELECT browser FROM conversations").first("browser"),
      ),
      /Fixture browser/,
    );
    assert.ok(
      !JSON.stringify(
        await db.prepare("SELECT * FROM conversations").all(),
      ).includes(first.capability),
    );
  } finally {
    await dispose();
  }
});

test("replaying a request does not call the agent or duplicate rows; changed input and foreign capabilities are rejected", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = input();
    await drain(await startTurn(store, agent, first, {}, signal()));
    const failIfCalled: ChatAgent = () => {
      throw new Error("Replay called model");
    };
    const replay = await drain(
      await startTurn(store, failIfCalled, first, {}, signal()),
    );
    assert.deepEqual(replay.at(-1), { type: "complete", answer });
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      2,
    );
    await assert.rejects(
      store.accept({ ...first, text: "changed" }, {}),
      (error) => error instanceof ChatConflict && error.status === 409,
    );
    await assert.rejects(
      store.accept({ ...first, capability: crypto.randomUUID() }, {}),
      (error) => error instanceof ChatConflict && error.status === 403,
    );
  } finally {
    await dispose();
  }
});

test("concurrent D1 admissions have one winner and leave no orphan messages", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = input();
    const results = await Promise.allSettled([
      store.accept(first, {}),
      store.accept(
        { ...first, requestId: crypto.randomUUID(), text: "other" },
        {},
      ),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(results.filter((r) => r.status === "rejected").length, 1);
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM turns").first("n"),
      1,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      2,
    );
  } finally {
    await dispose();
  }
});

test("provider failure and disconnect retain user and partial assistant text and release the conversation", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = input();
    const failing: ChatAgent = async function* () {
      yield { type: "text", text: "Część odpowiedzi" };
      throw new Error("private provider failure");
    };
    const events = await drain(
      await startTurn(store, failing, first, {}, signal()),
    );
    assert.equal(events.at(-1)?.type, "error");
    assert.ok(!JSON.stringify(events).includes("private provider failure"));
    assert.equal(
      await db
        .prepare("SELECT content FROM messages WHERE role = 'assistant'")
        .first("content"),
      "Część odpowiedzi",
    );
    assert.equal(
      await db.prepare("SELECT error_code FROM turns").first("error_code"),
      "generation_failed",
    );
    const next = { ...first, requestId: crypto.randomUUID(), text: "dalej" };
    const controller = new AbortController();
    const stream = await startTurn(store, agent, next, {}, controller.signal);
    await stream.next(); // start
    await stream.next(); // saved text
    controller.abort();
    await drain(stream);
    assert.equal(
      await db
        .prepare("SELECT status FROM turns WHERE id = ?")
        .bind(next.requestId)
        .first("status"),
      "interrupted",
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      4,
    );
    await store.accept(
      { ...first, requestId: crypto.randomUUID(), text: "nowe" },
      {},
    );
  } finally {
    await dispose();
  }
});

test("an abandoned turn expires and no longer blocks the next message", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = input();
    await store.accept(first, {});
    await store.saveText(first.requestId, "Saved partial");
    await db
      .prepare("UPDATE turns SET started_at = ?")
      .bind(Date.now() - 60000)
      .run();
    await store.accept(
      { ...first, requestId: crypto.randomUUID(), text: "nowe" },
      {},
    );
    assert.equal(
      await db
        .prepare("SELECT status FROM turns WHERE id = ?")
        .bind(first.requestId)
        .first("status"),
      "interrupted",
    );
    assert.equal(
      await db
        .prepare(
          "SELECT content FROM messages WHERE turn_id = ? AND role = 'assistant'",
        )
        .bind(first.requestId)
        .first("content"),
      "Saved partial",
    );
  } finally {
    await dispose();
  }
});

test("D1 enforces agent ownership and preserves drafts without copying sources into model history", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = { ...input(), agentId: "dodaj-pomysl" as const };
    const artifact = {
      title: "Mój Social Canvas",
      fields: [{ label: "Odbiorcy", value: "Seniorzy w Tarnowie" }],
    };
    const draftAgent: ChatAgent = async function* () {
      yield {
        type: "answer",
        answer: {
          ...answer,
          artifact,
          sources: [
            {
              id: "source",
              title: "Reference",
              url: "https://rops.krakow.pl/",
              excerpt: "Large source excerpt not for repeated history",
            },
          ],
        },
      };
    };
    await drain(await startTurn(store, draftAgent, first, {}, signal()));
    await assert.rejects(
      store.accept(
        {
          ...first,
          agentId: "odkrywaj",
          requestId: crypto.randomUUID(),
          text: "Cross-agent",
        },
        {},
      ),
      (error) => error instanceof ChatConflict && error.status === 409,
    );
    const next = await store.accept(
      { ...first, requestId: crypto.randomUUID(), text: "Popraw odbiorców" },
      {},
    );
    const prior = JSON.parse(next.history[1].content);
    assert.deepEqual(prior.artifact, artifact);
    assert.deepEqual(prior.sourceIds, ["source"]);
    assert.ok(!JSON.stringify(next.history).includes("Large source excerpt"));
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM conversations").first("n"),
      1,
    );
  } finally {
    await dispose();
  }
});

test("cancelling immediately after admission/start finalizes the assistant placeholder", async () => {
  const { db, store, dispose } = await freshDatabase();
  try {
    const first = input();
    const events = await startTurn(store, agent, first, {}, signal());
    await events.next();
    await events.return(undefined);
    assert.equal(
      await db.prepare("SELECT status FROM turns").first("status"),
      "interrupted",
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      2,
    );
    await store.accept(
      { ...first, requestId: crypto.randomUUID(), text: "next" },
      {},
    );
  } finally {
    await dispose();
  }
});
