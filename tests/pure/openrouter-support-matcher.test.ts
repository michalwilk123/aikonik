import assert from "node:assert/strict";
import { test } from "node:test";
import { createChatModel, MODEL_ID } from "../../infrastructure/ai/openrouter";
import { makeOpenRouterSupportMatcher } from "../../infrastructure/support/openrouter-support-matcher";

function completion(content: unknown) {
  return new Response(
    JSON.stringify({
      id: "fixture-completion",
      object: "chat.completion",
      created: 1,
      model: MODEL_ID,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: JSON.stringify(content) },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

test("calls only DeepSeek with the user's query and validates the generated answer", async () => {
  const requests: Record<string, unknown>[] = [];
  const answer = {
    message: "Komu ma pomagać Twój pomysł?",
    areaLabel: "Małopolska",
    offers: [],
  };
  const model = createChatModel("fixture-key", async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)));
    return completion(answer);
  });

  const result = await makeOpenRouterSupportMatcher(model).match(
    "Mam pomysł na pomoc seniorom",
  );
  assert.deepEqual(result, answer);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].model, "deepseek/deepseek-v4.1-flash");
  const messages = requests[0].messages as { role: string; content: string }[];
  assert.equal(
    messages.filter((message) => message.role === "system").length,
    1,
  );
  assert.deepEqual(
    messages.filter((message) => message.role === "user"),
    [{ role: "user", content: "Mam pomysł na pomoc seniorom" }],
  );
  assert.match(JSON.stringify(requests[0].response_format), /json_schema/);
  assert.ok(!JSON.stringify(messages).includes("fixture-key"));
});

test("rejects invalid model output instead of returning hardcoded offers", async () => {
  const model = createChatModel("fixture-key", async () =>
    completion({ offers: [] }),
  );
  await assert.rejects(
    makeOpenRouterSupportMatcher(model).match("Pomoc seniorom"),
  );
});

test("provider errors do not trigger retries or a model fallback", async () => {
  let calls = 0;
  const model = createChatModel("fixture-key", async () => {
    calls++;
    return new Response(JSON.stringify({ error: { message: "Unavailable" } }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  });
  await assert.rejects(
    makeOpenRouterSupportMatcher(model).match("Pomoc seniorom"),
  );
  assert.equal(calls, 1);
});

test("missing credentials fail before any model request", () => {
  assert.throws(() => createChatModel(" "), /OPENROUTER_API_KEY is missing/);
});
