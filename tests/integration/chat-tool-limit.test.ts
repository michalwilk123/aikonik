import assert from "node:assert/strict";
import { test } from "node:test";
import { startTurn } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { testDatabase } from "@/tests/helpers/d1";
import { sseChunk, streamResponse } from "@/tests/helpers/openrouter-stream";

test("repeated report calls leave a final step for a persisted Canvas answer", async () => {
  const fixture = await testDatabase();
  const artifact = {
    title: "Mój Social Canvas",
    fields: [{ label: "Opis pomysłu", value: "Budowa karmników dla ptaków" }],
  };
  const answer = {
    message: "Komu ma służyć pomysł budowy karmników?",
    sourceIds: [],
    artifact,
  };
  let requests = 0;
  const model = createChatModel("fixture-key", async (_url, init) => {
    requests += 1;
    const body = JSON.parse(String(init?.body));
    if (body.tools?.length) {
      return streamResponse([
        sseChunk({
          tool_calls: [
            {
              index: 0,
              id: `report-${requests}`,
              type: "function",
              function: {
                name: "read_report",
                arguments: JSON.stringify({ topic: "wszystkie" }),
              },
            },
          ],
        }),
        sseChunk({}, "tool_calls"),
      ]);
    }
    return streamResponse([
      sseChunk({ content: JSON.stringify(answer) }),
      sseChunk({}, "stop"),
    ]);
  });
  try {
    const events = await startTurn(
      fixture.store,
      makeChatAgent(model, "dodaj-pomysl"),
      {
        conversationId: crypto.randomUUID(),
        capability: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        agentId: "dodaj-pomysl",
        text: "Chcę zbudować karmniki dla ptaków",
      },
      {},
      new AbortController().signal,
    );
    const received = [];
    for await (const event of events) received.push(event);
    assert.equal(
      received.some((event) => event.type === "error"),
      false,
    );
    const complete = received.at(-1);
    assert.equal(complete?.type, "complete");
    if (complete?.type === "complete") {
      assert.equal(complete.answer.message, answer.message);
      assert.deepEqual(complete.answer.artifact, artifact);
    }
    assert.equal(requests, 3);
    const saved = await fixture.db
      .prepare(
        "SELECT content, answer, status FROM messages WHERE role = 'assistant'",
      )
      .first<{ content: string; answer: string; status: string }>();
    assert.equal(saved?.content, answer.message);
    assert.equal(saved?.status, "complete");
    assert.deepEqual(JSON.parse(saved?.answer ?? "null").artifact, artifact);
    assert.equal(
      await fixture.db.prepare("SELECT status FROM turns").first("status"),
      "complete",
    );
    assert.equal(
      await fixture.db
        .prepare("SELECT count(*) AS n FROM model_calls")
        .first("n"),
      3,
    );
    assert.equal(
      await fixture.db
        .prepare(
          "SELECT count(*) AS n FROM tool_calls WHERE status = 'complete'",
        )
        .first("n"),
      2,
    );
  } finally {
    await fixture.dispose();
  }
});
