import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentEvent } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { sseChunk, streamResponse } from "@/tests/helpers/openrouter-stream";

for (const agentId of ["odkrywaj", "wdrazanie-innowacji"] as const) {
  test(`${agentId} searches saved evidence, reads the project and attaches only cited catalog videos`, async () => {
    const requests: Record<string, unknown>[] = [];
    const model = createChatModel("fixture-key", async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      requests.push(request);
      const call = (name: string, args: object) =>
        streamResponse([
          sseChunk({
            tool_calls: [
              {
                index: 0,
                id: `call-${requests.length}`,
                type: "function",
                function: { name, arguments: JSON.stringify(args) },
              },
            ],
          }),
          sseChunk({}, "tool_calls"),
        ]);
      if (requests.length === 1) {
        const instructions = JSON.stringify(request.messages);
        assert.ok(
          instructions.length < 40000,
          "The corpus must stay out of the system prompt",
        );
        assert.match(instructions, /Nie dopasowuj na siłę/);
        assert.doesNotMatch(instructions, /MAPA WYZWAŃ SPOŁECZNYCH/);
        return call("search_innovations", { query: "Senior CUDER" });
      }
      if (requests.length === 2) {
        const messages = request.messages as {
          role: string;
          content: string;
        }[];
        assert.match(
          messages.find((message) => message.role === "tool")?.content ?? "",
          /senior-cuder/,
        );
        return call("read_innovation", {
          projectId: "senior-cuder",
          question: "samotność seniorów odbiorcy sposób działania",
        });
      }
      const messages = request.messages as { role: string; content: string }[];
      const evidence =
        messages.filter((message) => message.role === "tool").at(-1)?.content ??
        "";
      assert.match(evidence, /Senior CUDER/);
      assert.match(evidence, /samot/);
      return streamResponse([
        sseChunk({
          content: JSON.stringify({
            message:
              "Senior CUDER to model aktywizacji seniorów. Dokumentacja nie potwierdza aktualnego naboru.",
            sourceIds: [
              "innovation:senior-cuder:page",
              "innovation:invented:page",
            ],
            artifact: null,
          }),
        }),
        sseChunk({}, "stop"),
      ]);
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("Library retrieval must not fetch ROPS at runtime");
    }) as typeof fetch;
    try {
      const events: AgentEvent[] = [];
      for await (const event of makeChatAgent(model, agentId)(
        [
          {
            id: "question",
            role: "user",
            content:
              "Starsza osoba czuje się samotna. Jakie działania mogą pomóc?",
          },
        ],
        new AbortController().signal,
      ))
        events.push(event);
      assert.equal(requests.length, 3);
      const final = events.at(-1);
      assert.equal(final?.type, "answer");
      if (final?.type === "answer") {
        assert.deepEqual(
          final.answer.sources?.map((source) => source.id),
          ["innovation:senior-cuder:page"],
        );
        assert.deepEqual(final.answer.videos, [
          {
            projectId: "senior-cuder",
            title: "Senior CUDER",
            url: "https://www.youtube.com/watch?v=o5TP10ZStNA",
          },
        ]);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test(`${agentId} follow-up replies can cite known evidence from persisted history`, async () => {
    const model = createChatModel("fixture-key", async () =>
      streamResponse([
        sseChunk({
          content: JSON.stringify({
            message: "To model aktywizacji seniorów.",
            sourceIds: ["innovation:senior-cuder:page"],
            artifact: null,
          }),
        }),
        sseChunk({}, "stop"),
      ]),
    );
    const history = [
      { id: "first", role: "user" as const, content: "Samotny senior" },
      {
        id: "answer",
        role: "assistant" as const,
        content: JSON.stringify({
          message: "Senior CUDER",
          sourceIds: [
            "innovation:senior-cuder:page",
            "innovation:invented:page",
          ],
        }),
      },
      { id: "followup", role: "user" as const, content: "Jak to działa?" },
    ];
    const events: AgentEvent[] = [];
    for await (const event of makeChatAgent(model, agentId)(
      history,
      new AbortController().signal,
    ))
      events.push(event);
    const final = events.at(-1);
    assert.equal(final?.type, "answer");
    if (final?.type === "answer") {
      assert.deepEqual(
        final.answer.sources?.map((source) => source.id),
        ["innovation:senior-cuder:page"],
      );
      assert.equal(final.answer.videos?.length, 1);
    }
  });
}

test("project retrieval tools are unavailable to agents outside matchmaking and implementation", async () => {
  for (const agentId of [
    undefined,
    "wiedza",
    "dodaj-pomysl",
    "testuj-innowacje",
  ] as const) {
    const model = createChatModel("fixture-key", async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      const toolNames = (request.tools ?? []).map(
        (entry: { function: { name: string } }) => entry.function.name,
      );
      assert.ok(!toolNames.includes("search_innovations"));
      assert.ok(!toolNames.includes("read_innovation"));
      return streamResponse([
        sseChunk({
          content: JSON.stringify(
            agentId
              ? { message: "Odpowiedź", sourceIds: [], artifact: null }
              : { message: "Odpowiedź", areaLabel: "Małopolska", offers: [] },
          ),
        }),
        sseChunk({}, "stop"),
      ]);
    });
    for await (const _event of makeChatAgent(model, agentId)(
      [{ id: "question", role: "user", content: "Pomysł" }],
      new AbortController().signal,
    )) {
      /* drain */
    }
  }
});

test("knowledge reads social challenges, preserves citations on follow-up and excludes project videos", async () => {
  let requests = 0;
  let sourceId = "";
  const model = createChatModel("fixture-key", async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    requests++;
    if (requests === 1)
      return streamResponse([
        sseChunk({
          tool_calls: [
            {
              index: 0,
              id: "challenge",
              type: "function",
              function: {
                name: "read_social_challenges",
                arguments: '{"query":"samotność seniorów"}',
              },
            },
          ],
        }),
        sseChunk({}, "tool_calls"),
      ]);
    if (requests === 2) {
      const toolMessage = request.messages.find(
        (message: { role: string }) => message.role === "tool",
      );
      const evidence = JSON.parse(toolMessage.content);
      sourceId = evidence.sources[0].id;
      assert.match(sourceId, /^social-challenges:/);
    }
    return streamResponse([
      sseChunk({
        content: JSON.stringify({
          message: "Fakt ze źródła.",
          sourceIds: [sourceId, "innovation:senior-cuder:page"],
          artifact: {
            title: "Szkic",
            fields: [{ label: "Problem", value: "Samotność" }],
          },
        }),
      }),
      sseChunk({}, "stop"),
    ]);
  });
  const firstEvents: AgentEvent[] = [];
  for await (const event of makeChatAgent(model, "wiedza")(
    [
      {
        id: "question",
        role: "user",
        content: "Co wiemy o samotności seniorów?",
      },
    ],
    new AbortController().signal,
  ))
    firstEvents.push(event);
  const first = firstEvents.at(-1);
  assert.equal(first?.type, "answer");
  if (first?.type !== "answer") return;
  assert.deepEqual(
    first.answer.sources?.map((source) => source.id),
    [sourceId],
  );
  assert.equal(first.answer.videos, undefined);
  assert.equal(first.answer.artifact, null);
  const followupEvents: AgentEvent[] = [];
  for await (const event of makeChatAgent(model, "wiedza")(
    [
      {
        id: "question",
        role: "user",
        content: "Co wiemy o samotności seniorów?",
      },
      {
        id: "reply",
        role: "assistant",
        content: JSON.stringify({
          message: first.answer.message,
          sourceIds: [sourceId, "innovation:senior-cuder:page"],
        }),
      },
      { id: "followup", role: "user", content: "Podaj źródło." },
    ],
    new AbortController().signal,
  ))
    followupEvents.push(event);
  const followup = followupEvents.at(-1);
  assert.equal(followup?.type, "answer");
  if (followup?.type === "answer") {
    assert.deepEqual(
      followup.answer.sources?.map((source) => source.id),
      [sourceId],
    );
    assert.equal(followup.answer.videos, undefined);
    assert.equal(followup.answer.artifact, null);
  }
});

test("implementation preserves the service brief and catalog evidence on resource corrections, excluding legacy charts", async () => {
  const artifact = {
    title: "Plan usługi: Senior CUDER — biblioteka",
    fields: [
      { label: "Zasoby", value: "Koordynatorka i dwóch wolontariuszy." },
    ],
  };
  const updated = {
    ...artifact,
    fields: [{ label: "Zasoby", value: "Koordynatorka i jeden wolontariusz." }],
  };
  const model = createChatModel("fixture-key", async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    const previous = JSON.parse(
      request.messages.find(
        (message: { role: string }) => message.role === "assistant",
      ).content,
    );
    assert.deepEqual(previous.artifact, artifact);
    assert.equal(previous.visualizations, undefined);
    assert.deepEqual(previous.sourceIds, ["innovation:senior-cuder:page"]);
    assert.equal(
      request.messages.at(-1).content,
      "Został nam jeden wolontariusz. Zaktualizuj plan.",
    );
    return streamResponse([
      sseChunk({
        content: JSON.stringify({
          message: "Zaktualizowałem zasoby w roboczym planie.",
          sourceIds: ["innovation:senior-cuder:page"],
          artifact: updated,
        }),
      }),
      sseChunk({}, "stop"),
    ]);
  });
  const events: AgentEvent[] = [];
  for await (const event of makeChatAgent(model, "wdrazanie-innowacji")(
    [
      {
        id: "first",
        role: "user",
        content:
          "Wdrażamy Senior CUDER w bibliotece. Mamy koordynatorkę i dwóch wolontariuszy.",
      },
      {
        id: "answer",
        role: "assistant",
        content: JSON.stringify({
          message: "Roboczy plan usługi.",
          sourceIds: [
            "innovation:senior-cuder:page",
            "rops-2025-uslugi-spoleczne-diagnoza",
          ],
          artifact,
          visualizations: [{ title: "Stary wykres" }],
        }),
      },
      {
        id: "correction",
        role: "user",
        content: "Został nam jeden wolontariusz. Zaktualizuj plan.",
      },
    ],
    new AbortController().signal,
  ))
    events.push(event);
  const final = events.at(-1);
  assert.equal(final?.type, "answer");
  if (final?.type === "answer") {
    assert.deepEqual(final.answer.artifact, updated);
    assert.deepEqual(
      final.answer.sources?.map((source) => source.id),
      ["innovation:senior-cuder:page"],
    );
    assert.equal(final.answer.videos?.[0].projectId, "senior-cuder");
    assert.equal(final.answer.visualizations, undefined);
  }
});
