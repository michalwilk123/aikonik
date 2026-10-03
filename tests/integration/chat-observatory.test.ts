import assert from "node:assert/strict";
import { test } from "node:test";
import { startTurn } from "@/application/chat/runtime";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { testDatabase } from "@/tests/helpers/d1";
import { sseChunk, streamResponse } from "@/tests/helpers/openrouter-stream";

test("assistants one and four stream and persist a source-backed fertility chart from a tool call", async () => {
  const realFetch = globalThis.fetch;
  const upstreamRequests: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = String(input);
    upstreamRequests.push(url);
    if (url.endsWith("/differenceanalysis/135"))
      return new Response(null, {
        status: 302,
        headers: { location: "/trendanalysis/135" },
      });
    assert.equal(url, "https://obserwator.rops.krakow.pl/trendanalysis/135");
    return new Response(`<select id="trendanalysis_year"><option value="2024" selected="selected">2024</option></select>
      <script>var myChartValuesmyChartTA = [1.15]; var myChartValues2myChartTA = [1.10];</script>`);
  }) as typeof fetch;
  try {
    for (const agentId of ["odkrywaj", "wdrazanie-innowacji"] as const) {
      const fixture = await testDatabase();
      let calls = 0;
      const model = createChatModel("fixture-key", async (_url, init) => {
        calls++;
        const body = JSON.parse(String(init?.body));
        const names = body.tools.map(
          (entry: { function: { name: string } }) => entry.function.name,
        );
        assert.deepEqual(names, ["read_report", "show_map", "show_bar_chart"]);
        if (calls === 1)
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
        assert.match(JSON.stringify(body.messages), /1\.15/);
        return streamResponse([
          sseChunk({
            content: JSON.stringify({
              message:
                "W 2024 roku współczynnik dzietności w Małopolsce wyniósł 1,15.",
              sourceIds: [],
              artifact: null,
            }),
          }),
          sseChunk({}, "stop"),
        ]);
      });
      try {
        const input = {
          conversationId: crypto.randomUUID(),
          capability: crypto.randomUUID(),
          requestId: crypto.randomUUID(),
          agentId,
          text: "Jak wygląda dzietność w woj. małopolskim?",
        };
        const events = await startTurn(
          fixture.store,
          makeChatAgent(model, agentId),
          input,
          {},
          new AbortController().signal,
        );
        const received = [];
        for await (const event of events) received.push(event);
        const complete = received.at(-1);
        assert.equal(complete?.type, "complete");
        if (complete?.type !== "complete")
          throw new Error("Chart answer did not complete");
        assert.equal(complete.answer.visualizations?.length, 1);
        const chart = complete.answer.visualizations?.[0];
        assert.equal(chart?.kind, "bar");
        assert.equal(chart?.year, 2024);
        assert.deepEqual(
          chart?.points.map((point) => point.value),
          [1.15, 1.1],
        );
        const saved = await fixture.db
          .prepare("SELECT answer FROM messages WHERE role = 'assistant'")
          .first<string>("answer");
        assert.deepEqual(
          JSON.parse(saved ?? "null").visualizations,
          complete.answer.visualizations,
        );
        const replay = await fixture.store.accept(input, {});
        assert.deepEqual(
          replay.replay?.answer?.visualizations,
          complete.answer.visualizations,
        );
        assert.equal(calls, 2);
      } finally {
        await fixture.dispose();
      }
    }
    assert.equal(upstreamRequests.length, 4);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("a map tool call reaches the final streamed answer with source county data", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input) => {
    if (String(input).endsWith("/flashdata.xml"))
      return new Response(
        '<region id="POW_1" name="powiat bocheński">598</region>',
      );
    return new Response(
      '<select id="differenceanalysis_year"><option value="2024" selected="selected">2024</option></select>',
    );
  }) as typeof fetch;
  let calls = 0;
  const model = createChatModel("fixture-key", async () => {
    calls++;
    if (calls === 1)
      return streamResponse([
        sseChunk({
          tool_calls: [
            {
              index: 0,
              id: "map",
              type: "function",
              function: { name: "show_map", arguments: '{"indicatorId":22}' },
            },
          ],
        }),
        sseChunk({}, "tool_calls"),
      ]);
    return streamResponse([
      sseChunk({
        content: JSON.stringify({
          message: "Mapa danych o kinach w 2024 roku.",
          sourceIds: [],
          artifact: null,
        }),
      }),
      sseChunk({}, "stop"),
    ]);
  });
  try {
    const events = [];
    for await (const event of makeChatAgent(model, "odkrywaj")(
      [{ id: "question", role: "user", content: "Pokaż mapę kin" }],
      new AbortController().signal,
    ))
      events.push(event);
    const answer = events.at(-1);
    assert.equal(answer?.type, "answer");
    if (answer?.type !== "answer")
      throw new Error("Map answer did not complete");
    const map = answer.answer.visualizations?.[0];
    assert.equal(map?.kind, "map");
    assert.equal(map?.points[0]?.value, 598);
    assert.equal(map?.points[0]?.id, "POW_1");
    assert.ok(
      events.some(
        (event) =>
          event.type === "tool" &&
          event.name === "show_map" &&
          event.status === "complete",
      ),
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});
