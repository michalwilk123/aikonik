import assert from "node:assert/strict";
import { test } from "node:test";
import { agentIds } from "@/agents/registry";
import { replyToAgent } from "@/agents/server";
import { createChatModel, MODEL_ID } from "@/infrastructure/ai/openrouter";

test("all real agent adapters route distinct instructions and preserve response ownership", async () => {
  for (const agentId of agentIds) {
    const requests: Record<string, unknown>[] = [];
    const artifact = {
      title: "Szkic",
      fields: [{ label: "Problem", value: "Samotność seniorów" }],
    };
    const model = createChatModel("fixture-key", async (_url, init) => {
      requests.push(JSON.parse(String(init?.body)));
      return new Response(
        JSON.stringify({
          id: "fixture",
          object: "chat.completion",
          created: 1,
          model: MODEL_ID,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  message: "Komu ma pomagać rozwiązanie?",
                  sourceIds: ["invented-source"],
                  artifact,
                }),
              },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    });
    const requestId = crypto.randomUUID();
    const result = await replyToAgent(
      {
        agentId,
        requestId,
        messages: [
          {
            id: crypto.randomUUID(),
            agentId,
            role: "user",
            content: "Pomysł pomocy seniorom",
            createdAt: new Date().toISOString(),
          },
        ],
        previousArtifact: artifact,
      },
      model,
      new AbortController().signal,
    );
    assert.equal(result.requestId, requestId);
    assert.equal(result.message.agentId, agentId);
    assert.equal(result.message.role, "assistant");
    assert.equal(result.model, MODEL_ID);
    assert.deepEqual(result.sources, []);
    assert.deepEqual(
      result.artifact,
      agentId === "odkrywaj" || agentId === "wiedza" ? null : artifact,
    );
    assert.equal(requests.length, 1);
    const messages = requests[0].messages as {
      role: string;
      content: string | { type: string; text: string }[];
    }[];
    assert.equal(
      messages.filter((message) => message.role === "system").length,
      1,
    );
    const instruction = messages.find(
      (message) => message.role === "system",
    )?.content;
    const instructionText =
      typeof instruction === "string"
        ? instruction
        : (instruction?.map((part) => part.text).join("\n") ?? "");
    assert.ok(instructionText.includes(`jako agent ${agentId}`));
    assert.deepEqual(
      messages.filter((message) => message.role === "user"),
      [{ role: "user", content: "Pomysł pomocy seniorom" }],
    );
    if (agentId !== "odkrywaj" && agentId !== "wiedza")
      assert.ok(instructionText.includes(JSON.stringify(artifact)));
  }
});

test("agent runtime rejects malformed output without returning a fallback", async () => {
  const model = createChatModel(
    "fixture-key",
    async () =>
      new Response(
        JSON.stringify({
          id: "fixture",
          object: "chat.completion",
          created: 1,
          model: MODEL_ID,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"offers":[]}' },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
  );
  await assert.rejects(
    replyToAgent(
      {
        agentId: "odkrywaj",
        requestId: crypto.randomUUID(),
        messages: [
          {
            id: crypto.randomUUID(),
            agentId: "odkrywaj",
            role: "user",
            content: "Pomoc seniorom",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      model,
      new AbortController().signal,
    ),
  );
});
