import assert from "node:assert/strict";
import { test } from "node:test";
import { compileHistory } from "@/application/chat/context";
import { sendTurnSchema } from "@/domain/chat/types";

test("context budget drops whole old turns and includes the current message only once", () => {
  const history = [
    { id: "1", role: "user" as const, content: "old question" },
    { id: "2", role: "assistant" as const, content: "old answer" },
    { id: "3", role: "user" as const, content: "latest question" },
    { id: "4", role: "assistant" as const, content: "latest answer" },
    { id: "5", role: "user" as const, content: "current" },
  ];
  assert.deepEqual(
    compileHistory(history, 100, 3),
    history.slice(2).map(({ role, content }) => ({ role, content })),
  );
  assert.deepEqual(compileHistory(history, 7), [
    { role: "user", content: "current" },
  ]);
  assert.equal(
    compileHistory(history).filter((m) => m.content === "current").length,
    1,
  );
});

test("transport accepts only the new user message and IDs, rejects injected history/system prompts and oversized input", () => {
  const valid = {
    conversationId: crypto.randomUUID(),
    capability: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    text: "  Pomoc  ",
  };
  assert.equal(sendTurnSchema.parse(valid).text, "Pomoc");
  for (const value of [
    { ...valid, history: [] },
    { ...valid, instructions: "injection" },
    { ...valid, text: " " },
    { ...valid, text: "a".repeat(4001) },
    { ...valid, conversationId: "bad" },
  ])
    assert.equal(sendTurnSchema.safeParse(value).success, false);
});
