import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSources, selectAgentHistory } from "@/agents/context";
import { retrieveKnowledge } from "@/agents/odkrywaj/knowledge";
import { type AgentMessage, agentRequestSchema } from "@/agents/types";

function message(
  role: "user" | "assistant",
  content: string,
  agentId: AgentMessage["agentId"] = "odkrywaj",
): AgentMessage {
  return {
    id: crypto.randomUUID(),
    agentId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

test("rejects history belonging to another agent", () => {
  const request = {
    agentId: "odkrywaj",
    requestId: crypto.randomUUID(),
    messages: [message("user", "Mój pomysł", "dodaj-pomysl")],
  };
  assert.equal(agentRequestSchema.safeParse(request).success, false);
  assert.equal(
    agentRequestSchema.safeParse({ ...request, agentId: "dodaj-pomysl" })
      .success,
    true,
  );
});

test("matching and knowledge conversations cannot share transcripts", () => {
  const request = {
    agentId: "wiedza",
    requestId: crypto.randomUUID(),
    messages: [message("user", "Pokaż dane o seniorach", "wiedza")],
  };
  assert.equal(agentRequestSchema.safeParse(request).success, true);
  assert.equal(
    agentRequestSchema.safeParse({ ...request, agentId: "odkrywaj" }).success,
    false,
  );
});

test("rejects an assistant-only request and excessive context", () => {
  const request = { agentId: "odkrywaj", requestId: crypto.randomUUID() };
  assert.equal(
    agentRequestSchema.safeParse({
      ...request,
      messages: [message("assistant", "Odpowiedź")],
    }).success,
    false,
  );
  assert.equal(
    agentRequestSchema.safeParse({
      ...request,
      messages: Array.from({ length: 9 }, () =>
        message("user", "a".repeat(4000)),
      ),
    }).success,
    false,
  );
});

test("preserves whole recent turns and the latest question within budget", () => {
  const history = Array.from({ length: 10 }, (_, i) => [
    message("user", `pytanie-${i}${"x".repeat(2000)}`),
    message("assistant", `odpowiedz-${i}${"x".repeat(2000)}`),
  ]).flat();
  const selected = selectAgentHistory([
    ...history,
    message("user", "ostatnie pytanie"),
  ]);
  assert.equal(selected.at(-1)?.content, "ostatnie pytanie");
  assert.equal(selected[0]?.role, "user");
  assert.ok(
    selected.reduce((size, entry) => size + entry.content.length, 0) <= 32000,
  );
  assert.equal(
    agentRequestSchema.safeParse({
      agentId: "odkrywaj",
      requestId: crypto.randomUUID(),
      messages: selected,
    }).success,
    true,
  );
});

test("retrieves cited care facts without inventing coverage for unrelated topics", () => {
  const care = retrieveKnowledge("pomoc sąsiedzka i usługi opiekuńcze");
  assert.ok(care.some((source) => source.id === "neighbour-care-2024"));
  assert.ok(
    care.every(
      (source) =>
        source.url.startsWith("https://rops.krakow.pl/") && source.page,
    ),
  );
  assert.deepEqual(retrieveKnowledge("kosmiczne rakiety"), []);
});

test("model source IDs cannot introduce fabricated source links", () => {
  const available = retrieveKnowledge("seniorzy");
  const first = available[0];
  assert.ok(first);
  assert.deepEqual(
    resolveSources([first.id, first.id, "invented-source"], available),
    [first],
  );
});
