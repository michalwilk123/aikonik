import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentEvent } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { sseChunk, streamResponse } from "@/tests/helpers/openrouter-stream";

test("fertility chart values, geographic coverage and source reach the answering model", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url) => {
    assert.equal(
      new URL(String(url)).origin,
      "https://obserwator.rops.krakow.pl",
    );
    if (String(url).includes("differenceanalysis"))
      return new Response(null, {
        status: 302,
        headers: { location: "/trendanalysis/135" },
      });
    return new Response(
      '<select id="trendanalysis_year"><option value="2024" selected="selected">2024</option></select>' +
        '<canvas data-chart-child-region="województwo małopolskie" data-chart-parent-region="Polska"></canvas>' +
        "<script>var myChartValuesmyChartTA = [1.15];var myChartValues2myChartTA = [1.1];</script>",
    );
  }) as typeof fetch;
  try {
    const requests: Record<string, unknown>[] = [];
    const model = createChatModel("fixture-key", async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      requests.push(request);
      if (requests.length === 1)
        return streamResponse([
          sseChunk({
            tool_calls: [
              {
                index: 0,
                id: "fertility",
                type: "function",
                function: {
                  name: "show_bar_chart",
                  arguments: '{"indicatorId":135}',
                },
              },
            ],
          }),
          sseChunk({}, "tool_calls"),
        ]);
      const messages = request.messages as { role: string; content: string }[];
      const tool = messages.find((message) => message.role === "tool");
      assert.ok(tool, "The answer step must receive chart evidence");
      const evidence = JSON.parse(tool.content);
      assert.equal(evidence.year, 2024);
      assert.equal(
        evidence.sourceUrl,
        "https://obserwator.rops.krakow.pl/trendanalysis/135",
      );
      assert.deepEqual(evidence.data, [
        ["województwo małopolskie", 1.15],
        ["Polska", 1.1],
      ]);
      assert.ok(!JSON.stringify(evidence.data).includes("Kraków"));
      const instructions = messages.find(
        (message) => message.role === "system",
      );
      assert.doesNotMatch(
        JSON.stringify(instructions?.content ?? ""),
        /Statystyki muszą pochodzić z tych źródeł; podaj tytuł raportu/,
        "The report-only policy must not override successful chart evidence",
      );
      return streamResponse([
        sseChunk({
          content: JSON.stringify({
            message:
              "Na wykresie Obserwatora za 2024 r. współczynnik dzietności wynosi 1,15 dla Małopolski i 1,1 dla Polski.",
            sourceIds: [],
            artifact: null,
          }),
        }),
        sseChunk({}, "stop"),
      ]);
    });
    const events: AgentEvent[] = [];
    for await (const event of makeChatAgent(model, "wiedza")(
      [
        {
          id: "question",
          role: "user",
          content: "Jaka mamy dzietnosc w krakowie?",
        },
      ],
      new AbortController().signal,
    ))
      events.push(event);
    assert.equal(requests.length, 2);
    const final = events.at(-1);
    assert.equal(final?.type, "answer");
    if (final?.type === "answer")
      assert.deepEqual(
        final.answer.visualizations?.[0].points.map(({ value }) => value),
        [1.15, 1.1],
      );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
