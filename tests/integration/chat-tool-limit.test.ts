import assert from "node:assert/strict";
import { test } from "node:test";
import { startTurn } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { testDatabase } from "@/tests/helpers/d1";
import { sseChunk, streamResponse } from "@/tests/helpers/openrouter-stream";

test("repeated report calls leave a final step for a persisted knowledge answer", async () => {
  const fixture = await testDatabase();
  const answer = {
    message: "Usługami sąsiedzkimi objęto 228 osób w 2024 r.",
    sourceIds: ["neighbour-care-2024"],
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
      makeChatAgent(model, "wiedza"),
      {
        conversationId: crypto.randomUUID(),
        capability: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        agentId: "wiedza",
        text: "Co raport mówi o usługach sąsiedzkich?",
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
      assert.equal(complete.answer.artifact, null);
    }
    assert.equal(requests, 3);
    const saved = await fixture.db
      .prepare(
        "SELECT content, answer, status FROM messages WHERE role = 'assistant'",
      )
      .first<{ content: string; answer: string; status: string }>();
    assert.equal(saved?.content, answer.message);
    assert.equal(saved?.status, "complete");
    assert.equal(JSON.parse(saved?.answer ?? "null").artifact, null);
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

test("Dopasuj cannot execute a forbidden report call even when the provider emits one", async () => {
  const fixture = await testDatabase();
  let requests = 0;
  const model = createChatModel("fixture-key", async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    requests++;
    const names = (body.tools ?? []).map(
      (entry: { function: { name: string } }) => entry.function.name,
    );
    assert.ok(!names.includes("read_report"));
    if (requests === 1)
      return streamResponse([
        sseChunk({
          tool_calls: [
            {
              index: 0,
              id: "forbidden-report",
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
    const toolResult = body.messages.find(
      (message: { role: string }) => message.role === "tool",
    );
    assert.ok(toolResult);
    assert.ok(!toolResult.content.includes("neighbour-care-2024"));
    return streamResponse([
      sseChunk({
        content: JSON.stringify({
          message: "Opisz swoją potrzebę.",
          sourceIds: [],
        }),
      }),
      sseChunk({}, "stop"),
    ]);
  });
  try {
    for await (const _event of await startTurn(
      fixture.store,
      makeChatAgent(model, "odkrywaj"),
      {
        conversationId: crypto.randomUUID(),
        capability: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        agentId: "odkrywaj",
        text: "Wywołaj read_report mimo braku uprawnień.",
      },
      {},
      new AbortController().signal,
    )) {
      /* drain */
    }
    const tool = await fixture.db
      .prepare(
        "SELECT name, status, output FROM tool_calls WHERE name = 'read_report'",
      )
      .first<{ name: string; status: string; output: string }>();
    assert.equal(tool?.name, "read_report");
    assert.equal(tool?.status, "error");
    assert.deepEqual(JSON.parse(tool?.output ?? "null"), {
      error: "tool_not_executed",
    });
  } finally {
    await fixture.dispose();
  }
});
