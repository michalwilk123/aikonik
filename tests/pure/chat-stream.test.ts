import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentEvent } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { readReport } from "@/infrastructure/chat/report-tool";
import {
  answerStream,
  sseChunk,
  streamResponse,
} from "@/tests/helpers/openrouter-stream";

const history = [
  { id: "q1", role: "user" as const, content: "Jestem z Tarnowa" },
  {
    id: "a1",
    role: "assistant" as const,
    content: "Jakiego wsparcia potrzebujesz?",
  },
  { id: "q2", role: "user" as const, content: "Dla mamy" },
];

test("real OpenRouter adapter emits readable text before the provider has finished, with history once and tool descriptions", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let request: Record<string, unknown> = {};
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      c.enqueue(sseChunk({ content: '{"message":"Pierwszy fragment' }));
    },
  });
  const model = createChatModel("fixture-key", async (_url, init) => {
    request = JSON.parse(String(init?.body));
    return new Response(body, {
      headers: { "Content-Type": "text/event-stream" },
    });
  });
  const iterator = makeChatAgent(model)(history, new AbortController().signal)[
    Symbol.asyncIterator
  ]();
  try {
    const first = await iterator.next();
    assert.equal(first.value?.type, "text");
    assert.equal(
      first.value?.type === "text" && first.value.text,
      "Pierwszy fragment",
    );
    assert.equal(request.stream, true);
    const messages = request.messages as { role: string; content: string }[];
    assert.equal(messages.filter((m) => m.role === "system").length, 1);
    assert.deepEqual(
      messages.filter((m) => m.role !== "system"),
      history.map(({ role, content }) => ({ role, content })),
    );
    assert.match(JSON.stringify(request.tools), /read_report/);
    assert.match(JSON.stringify(request.tools), /2024/);
    assert.ok(!JSON.stringify(request).includes("fixture-key"));
    controller.enqueue(
      sseChunk({ content: ' i reszta.","areaLabel":"Tarnów","offers":[]}' }),
    );
    controller.enqueue(sseChunk({}, "stop"));
    controller.close();
    const events: AgentEvent[] = [];
    for await (const event of { [Symbol.asyncIterator]: () => iterator })
      events.push(event);
    assert.ok(events.some((e) => e.type === "model" && e.usage.input === 10));
    assert.deepEqual(events.at(-1), {
      type: "answer",
      answer: {
        message: "Pierwszy fragment i reszta.",
        areaLabel: "Tarnów",
        offers: [],
      },
    });
    assert.ok(
      events.every((e) => e.type !== "text" || !e.text.includes('"message"')),
    );
  } finally {
    await iterator.return?.();
  }
});

test("actual report tool executes and its call/result pair reaches the continuation with tools and instructions intact", async () => {
  const requests: Record<string, unknown>[] = [];
  const model = createChatModel("fixture-key", async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)));
    if (requests.length === 1)
      return streamResponse([
        sseChunk({
          tool_calls: [
            {
              index: 0,
              id: "report-call",
              type: "function",
              function: {
                name: "read_report",
                arguments: '{"topic":"opieka"}',
              },
            },
          ],
        }),
        sseChunk({}, "tool_calls"),
      ]);
    return answerStream("Dane z raportu z 2024 roku, strona 26.");
  });
  const events: AgentEvent[] = [];
  for await (const event of makeChatAgent(model)(
    [{ id: "q", role: "user", content: "Podaj statystyki usług opiekuńczych" }],
    new AbortController().signal,
  ))
    events.push(event);
  assert.equal(requests.length, 2);
  const second = requests[1].messages as {
    role: string;
    tool_call_id?: string;
    content: string;
  }[];
  assert.equal(second.filter((m) => m.role === "system").length, 1);
  const tool = second.find((m) => m.role === "tool");
  assert.equal(tool?.tool_call_id, "report-call");
  assert.match(tool?.content ?? "", /municipal-care-coverage-2024/);
  assert.match(tool?.content ?? "", /7420|7 420/);
  assert.match(JSON.stringify(requests[1].tools), /read_report/);
  assert.ok(events.some((e) => e.type === "tool" && e.name === "read_report"));
  assert.equal(events.filter((e) => e.type === "model").length, 2);
  assert.equal(events.at(-1)?.type, "answer");
});

test("invalid structured output and provider failure preserve model-call diagnostics without fabricating an answer", async () => {
  for (const response of [
    () =>
      streamResponse([
        sseChunk({ content: '{"offers":[]}' }),
        sseChunk({}, "stop"),
      ]),
    () =>
      new Response(
        JSON.stringify({ error: { message: "Private upstream error" } }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
  ]) {
    let calls = 0;
    const model = createChatModel("fixture-key", async () => {
      calls++;
      return response();
    });
    const events: AgentEvent[] = [];
    await assert.rejects(async () => {
      for await (const event of makeChatAgent(model)(
        history,
        new AbortController().signal,
      ))
        events.push(event);
    });
    assert.equal(calls, 1);
    assert.equal(events.filter((e) => e.type === "model").length, 1);
    assert.ok(events.every((e) => e.type !== "answer"));
  }
});

test("report functionality validates input, limits topics and returns source/page/year rather than invented providers", () => {
  const report = readReport({ topic: "opieka" });
  assert.equal(report.facts.length, 3);
  assert.ok(report.facts.every((f) => f.page === 26));
  assert.equal(report.dataYear, 2024);
  assert.equal(report.sourceId, "rops-2025-uslugi-spoleczne-diagnoza");
  assert.equal(readReport({ topic: "seniorzy" }).facts.length, 2);
  assert.equal(readReport({ topic: "wszystkie" }).facts.length, 5);
  assert.throws(() =>
    readReport({ topic: "send_email" } as unknown as Parameters<
      typeof readReport
    >[0]),
  );
});

test("all four streaming agents keep their role, resolve allowed sources and restrict discovery artifacts", async () => {
  const ids = [
    "odkrywaj",
    "dodaj-pomysl",
    "testuj-innowacje",
    "wdrazanie-innowacji",
  ] as const;
  for (const id of ids) {
    let request: Record<string, unknown> = {};
    const artifact = {
      title: "Szkic",
      fields: [{ label: "Odbiorcy", value: "Seniorzy w Tarnowie" }],
    };
    const model = createChatModel("fixture-key", async (_url, init) => {
      request = JSON.parse(String(init?.body));
      return streamResponse([
        sseChunk({
          content: JSON.stringify({
            message: "Odpowiedź",
            sourceIds: ["invented-source"],
            artifact,
          }),
        }),
        sseChunk({}, "stop"),
      ]);
    });
    const events: AgentEvent[] = [];
    for await (const event of makeChatAgent(model, id)(
      history,
      new AbortController().signal,
    ))
      events.push(event);
    const messages = request.messages as { role: string; content: string }[];
    assert.equal(
      messages.filter((message) => message.role === "system").length,
      1,
    );
    assert.match(
      JSON.stringify(messages[0].content),
      new RegExp(`agent ${id}`),
    );
    assert.equal(
      messages.filter((message) => message.role === "user").length,
      2,
    );
    const final = events.at(-1);
    assert.equal(final?.type, "answer");
    if (final?.type === "answer") {
      assert.deepEqual(final.answer.sources, []);
      assert.deepEqual(
        final.answer.artifact,
        id === "odkrywaj" ? null : artifact,
      );
    }
  }
});

test("invalid tool arguments and unavailable tools never execute and their attempts are recorded", async () => {
  for (const [name, args] of [
    ["read_report", '{"topic":"send_email"}'],
    ["send_email", '{"recipient":"someone"}'],
  ]) {
    let calls = 0;
    const model = createChatModel("fixture-key", async () => {
      calls++;
      if (calls === 1)
        return streamResponse([
          sseChunk({
            tool_calls: [
              {
                index: 0,
                id: "invalid-call",
                type: "function",
                function: { name, arguments: args },
              },
            ],
          }),
          sseChunk({}, "tool_calls"),
        ]);
      return answerStream("Nie mogę wysłać wiadomości.");
    });
    const events: AgentEvent[] = [];
    for await (const event of makeChatAgent(model)(
      history,
      new AbortController().signal,
    ))
      events.push(event);
    const attempt = events.find((event) => event.type === "tool");
    assert.equal(attempt?.type, "tool");
    if (attempt?.type === "tool") {
      assert.equal(attempt.status, "error");
      assert.deepEqual(attempt.output, { error: "tool_not_executed" });
    }
    assert.equal(events.at(-1)?.type, "answer");
  }
});

test("repeated report calls reserve the last model step for a complete answer", async () => {
  const requests: Record<string, unknown>[] = [];
  const model = createChatModel("fixture-key", async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    requests.push(request);
    if (!request.tools || request.tool_choice === "none")
      return streamResponse([
        sseChunk({
          content: JSON.stringify({
            message: "Komu ma pomóc wspólne budowanie karmników?",
            sourceIds: [],
            artifact: {
              title: "Mój Social Canvas",
              fields: [
                {
                  label: "Opis pomysłu",
                  value: "Budowanie karmników dla ptaków",
                },
              ],
            },
          }),
        }),
        sseChunk({}, "stop"),
      ]);
    return streamResponse([
      sseChunk({
        tool_calls: [
          {
            index: 0,
            id: `report-${requests.length}`,
            type: "function",
            function: {
              name: "read_report",
              arguments: '{"topic":"wszystkie"}',
            },
          },
        ],
      }),
      sseChunk({}, "tool_calls"),
    ]);
  });
  const events: AgentEvent[] = [];
  for await (const event of makeChatAgent(model, "dodaj-pomysl")(
    [{ id: "q", role: "user", content: "Chce zbudowac karmniki dla ptakow" }],
    new AbortController().signal,
  ))
    events.push(event);
  assert.equal(requests.length, 3);
  assert.equal(requests[2].tools, undefined);
  assert.notEqual(requests[2].tool_choice, "auto");
  assert.equal(events.filter((event) => event.type === "tool").length, 2);
  assert.equal(events.at(-1)?.type, "answer");
});
