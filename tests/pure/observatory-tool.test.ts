import assert from "node:assert/strict";
import { test } from "node:test";
import type { ObservatoryVisualization } from "@/domain/observatory";
import {
  makeObservatoryTools,
  observatoryInputSchema,
} from "@/infrastructure/chat/observatory-tool";

const visualization: ObservatoryVisualization = {
  indicatorId: 135,
  title: "Współczynnik dzietności",
  year: 2024,
  sourceUrl: "https://obserwator.rops.krakow.pl/trendanalysis/135",
  kind: "bar",
  points: [
    { id: "malopolska", label: "Małopolska", value: 1.15 },
    { id: "polska", label: "Polska", value: 1.1 },
  ],
};
const options = {
  toolCallId: "fixture",
  messages: [],
  context: {},
  abortSignal: new AbortController().signal,
};

test("observatory factory provides map and bar chart tools", () => {
  assert.deepEqual(Object.keys(makeObservatoryTools(() => {})), [
    "show_map",
    "show_bar_chart",
  ]);
});

test("visualization input accepts indicator and year, never a model supplied URL or data", () => {
  assert.deepEqual(observatoryInputSchema.parse({ indicatorId: 135 }), {
    indicatorId: 135,
  });
  for (const input of [
    { indicatorId: -1 },
    { indicatorId: 135, year: 1 },
    { indicatorId: 135, url: "https://example.com" },
    { indicatorId: 135, points: [{ value: 9 }] },
  ])
    assert.equal(observatoryInputSchema.safeParse(input).success, false);
});

test("successful tool calls publish only source generated data and preserve the selected year", async () => {
  const published: ObservatoryVisualization[] = [];
  const calls: unknown[] = [];
  const tools = makeObservatoryTools(
    (result) => published.push(result),
    async (input) => {
      calls.push(input);
      return visualization;
    },
  );
  const result = await tools.show_bar_chart.execute?.(
    { indicatorId: 135, year: 2024 },
    options,
  );
  assert.deepEqual(calls, [
    { indicatorId: 135, year: 2024, kind: "bar", signal: options.abortSignal },
  ]);
  assert.deepEqual(result, visualization);
  assert.deepEqual(published, [visualization]);
});

test("unavailable maps return an explicit failure and never publish a made up visualization", async () => {
  const published: ObservatoryVisualization[] = [];
  const tools = makeObservatoryTools(
    (result) => published.push(result),
    async () => {
      throw new Error("Private source response");
    },
  );
  const result = await tools.show_map.execute?.({ indicatorId: 135 }, options);
  assert.deepEqual(published, []);
  assert.match(JSON.stringify(result), /visualization_unavailable/);
  assert.equal(
    JSON.stringify(result).includes("Private source response"),
    false,
  );
});
