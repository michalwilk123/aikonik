import assert from "node:assert/strict";
import { test } from "node:test";
import { startTurn } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { eventResponse, readChatEvents } from "@/infrastructure/chat/transport";
import { testDatabase } from "@/tests/helpers/d1";
import { sseChunk } from "@/tests/helpers/openrouter-stream";

// Gate the actual provider transport: completion cannot arrive until the test
// sees readable, persisted text through the same parser used by the browser.
test("provider → D1 → HTTP → client emits saved text before model completion", async () => {
  const fixture = await testDatabase();
  const abort = new AbortController();
  let provider!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      provider = controller;
      controller.enqueue(
        sseChunk({ content: '{"message":"Pierwszy fragment' }),
      );
    },
  });
  const model = createChatModel(
    "fixture-key",
    async () =>
      new Response(body, {
        headers: { "Content-Type": "text/event-stream" },
      }),
  );
  const input = {
    conversationId: crypto.randomUUID(),
    capability: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    text: "Syntetyczne pytanie",
  };
  const events = await startTurn(
    fixture.store,
    makeChatAgent(model),
    input,
    {},
    abort.signal,
  );
  const response = eventResponse(events, abort);
  assert.ok(response.body);
  const client = readChatEvents(response.body, abort.signal);
  const timer = setTimeout(() => abort.abort(), 5000);
  try {
    assert.equal((await client.next()).value?.type, "start");
    const first = (await client.next()).value;
    assert.deepEqual(first, { type: "text", text: "Pierwszy fragment" });
    assert.equal(
      await fixture.db
        .prepare("SELECT content FROM messages WHERE role = 'assistant'")
        .first("content"),
      "Pierwszy fragment",
    );
    assert.equal(
      await fixture.db.prepare("SELECT status FROM turns").first("status"),
      "running",
    );
    assert.equal(
      await fixture.db
        .prepare("SELECT count(*) AS n FROM model_calls")
        .first("n"),
      1,
    );
    assert.equal(
      await fixture.db
        .prepare("SELECT finish_reason FROM model_calls")
        .first("finish_reason"),
      "running",
    );
    provider.enqueue(
      sseChunk({
        content: ' i reszta.","areaLabel":"Małopolska","offers":[]}',
      }),
    );
    provider.enqueue(sseChunk({}, "stop"));
    provider.close();
    const rest = [];
    for await (const event of client) rest.push(event);
    assert.equal(rest.at(-1)?.type, "complete");
    assert.equal(
      await fixture.db.prepare("SELECT status FROM turns").first("status"),
      "complete",
    );
    assert.equal(
      await fixture.db.prepare("SELECT count(*) AS n FROM messages").first("n"),
      2,
    );
  } finally {
    clearTimeout(timer);
    abort.abort();
    await client.return(undefined);
    await fixture.dispose();
  }
});
