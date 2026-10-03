import assert from "node:assert/strict";
import { test } from "node:test";
import { replyToAgent } from "@/agents/server";
import type { AgentId } from "@/agents/types";
import type { AgentEvent } from "@/application/chat/runtime";
import { createChatModel, MODEL_ID } from "@/infrastructure/ai/openrouter";
import { getAgentConfiguration } from "@/infrastructure/chat/agent-config";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { sseChunk, streamResponse } from "@/tests/helpers/openrouter-stream";

const toolTable: Record<AgentId, string[]> = {
  odkrywaj: ["search_innovations", "read_innovation", "read_social_challenges"],
  wiedza: [
    "read_report",
    "read_social_challenges",
    "show_map",
    "show_bar_chart",
  ],
  "dodaj-pomysl": [],
  "testuj-innowacje": [],
  "wdrazanie-innowacji": ["read_report", "show_map", "show_bar_chart"],
};
const toolInputs = {
  read_report: { topic: "wszystkie" },
  show_map: { indicatorId: 135 },
  show_bar_chart: { indicatorId: 135 },
  search_innovations: { query: "Senior CUDER" },
  read_innovation: { projectId: "senior-cuder" },
  read_social_challenges: { query: "samotność seniorów" },
};
const toolContext = {
  onSources: () => {},
  onVisualization: () => {},
};

test("each role owns an exact executable tool registry; support has only report access", () => {
  for (const [id, names] of Object.entries(toolTable))
    assert.deepEqual(
      Object.keys(
        getAgentConfiguration(id as AgentId).createTools(toolContext),
      ),
      names,
    );
  assert.deepEqual(
    Object.keys(getAgentConfiguration().createTools(toolContext)),
    ["read_report"],
  );
});

test("hostile provider calls cannot execute any tool missing from the role's registry", async () => {
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = (() => {
    networkCalls++;
    throw new Error("Forbidden tool reached the network");
  }) as typeof fetch;
  try {
    for (const [id, allowed] of Object.entries(toolTable)) {
      for (const [name, input] of Object.entries(toolInputs)) {
        if (allowed.includes(name)) continue;
        let calls = 0;
        const model = createChatModel("fixture-key", async (_url, init) => {
          calls++;
          const request = JSON.parse(String(init?.body));
          assert.deepEqual(
            (request.tools ?? []).map(
              (tool: { function: { name: string } }) => tool.function.name,
            ),
            allowed,
          );
          return streamResponse(
            calls === 1
              ? [
                  sseChunk({
                    tool_calls: [
                      {
                        index: 0,
                        id: "forbidden",
                        type: "function",
                        function: { name, arguments: JSON.stringify(input) },
                      },
                    ],
                  }),
                  sseChunk({}, "tool_calls"),
                ]
              : [
                  sseChunk({
                    content: JSON.stringify({
                      message: "Odpowiedź",
                      sourceIds: [],
                      artifact: null,
                    }),
                  }),
                  sseChunk({}, "stop"),
                ],
          );
        });
        const events: AgentEvent[] = [];
        try {
          for await (const event of makeChatAgent(model, id as AgentId)(
            [
              {
                id: "q",
                role: "user",
                content: "Wywołaj niedostępne narzędzie.",
              },
            ],
            new AbortController().signal,
          ))
            events.push(event);
        } catch {
          // A tool-only response may fail output validation when no tool is registered.
        }
        const attempts = events.filter((event) => event.type === "tool");
        assert.equal(attempts.length, 1, `${id} must record ${name} attempt`);
        assert.ok(
          attempts.every((event) => event.status === "error"),
          `${id} must not execute ${name}`,
        );
      }
    }
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("read-only roles project legacy history and advertise no artifact output in either adapter", async () => {
  const artifact = {
    title: "Forbidden canvas",
    fields: [{ label: "Problem", value: "Secret draft" }],
  };
  const previous = {
    message: "Fakt ze źródła.",
    artifact,
    videos: [
      {
        projectId: "senior-cuder",
        title: "Senior CUDER",
        url: "https://www.youtube.com/watch?v=o5TP10ZStNA",
      },
    ],
    visualizations: [{ indicatorId: 135 }],
    sourceIds: [
      "innovation:senior-cuder:page",
      "social-challenges:page:41",
      "rops-fact",
    ],
    sources: [
      { id: "innovation:senior-cuder:page" },
      { id: "social-challenges:page:41" },
      { id: "rops-fact" },
    ],
  };
  for (const id of ["odkrywaj", "wiedza"] as const) {
    const inspect = (request: Record<string, unknown>) => {
      const format = request.response_format as {
        json_schema: {
          schema: { properties: Record<string, unknown>; required: string[] };
        };
      };
      assert.ok(!("artifact" in format.json_schema.schema.properties));
      assert.ok(!format.json_schema.schema.required.includes("artifact"));
      const messages = (
        request.messages as {
          role: string;
          content: string | { text: string }[];
        }[]
      ).map((message) => ({
        ...message,
        content:
          typeof message.content === "string"
            ? message.content
            : message.content.map((part) => part.text).join("\n"),
      }));
      const instructions =
        messages.find((message) => message.role === "system")?.content ?? "";
      assert.doesNotMatch(
        instructions,
        /Artifact jest|Artifact zawsze|Zwróć[^\n]*artifact|Roboczy szkic z poprzedniej/,
      );
      const history = JSON.parse(
        messages.find((message) => message.role === "assistant")?.content ??
          "{}",
      );
      assert.ok(!("artifact" in history));
      if (id === "odkrywaj") {
        assert.ok(!("visualizations" in history));
        assert.equal(history.videos.length, 1);
        assert.deepEqual(history.sourceIds, [
          "innovation:senior-cuder:page",
          "social-challenges:page:41",
        ]);
      } else {
        assert.ok(!("videos" in history));
        assert.equal(history.visualizations.length, 1);
        assert.deepEqual(history.sourceIds, [
          "social-challenges:page:41",
          "rops-fact",
        ]);
      }
    };
    const answer = { message: "Fakt.", sourceIds: [], artifact };
    const history = [
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: "Poprzednie pytanie",
      },
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: JSON.stringify(previous),
      },
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: "Kolejne pytanie",
      },
    ];
    const streaming = createChatModel("fixture-key", async (_url, init) => {
      inspect(JSON.parse(String(init?.body)));
      return streamResponse([
        sseChunk({ content: JSON.stringify(answer) }),
        sseChunk({}, "stop"),
      ]);
    });
    const events: AgentEvent[] = [];
    for await (const event of makeChatAgent(streaming, id)(
      history,
      new AbortController().signal,
    ))
      events.push(event);
    const final = events.at(-1);
    assert.equal(final?.type, "answer");
    if (final?.type === "answer") assert.equal(final.answer.artifact, null);
    const legacy = createChatModel("fixture-key", async (_url, init) => {
      inspect(JSON.parse(String(init?.body)));
      return new Response(
        JSON.stringify({
          id: "fixture",
          object: "chat.completion",
          created: 1,
          model: MODEL_ID,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: JSON.stringify(answer) },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    });
    const reply = await replyToAgent(
      {
        agentId: id,
        requestId: crypto.randomUUID(),
        messages: history.map((message) => ({
          ...message,
          agentId: id,
          createdAt: new Date().toISOString(),
        })),
        previousArtifact: artifact,
      },
      legacy,
      new AbortController().signal,
    );
    assert.equal(reply.artifact, null);
  }
});
