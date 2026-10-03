import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ObservatoryVisualizationCard } from "@/agents/observatory-visualization";
import type { ObservatoryVisualization } from "@/domain/observatory";

const visualization: ObservatoryVisualization = {
  kind: "bar",
  indicatorId: 135,
  title: "Współczynnik dzietności",
  year: 2024,
  sourceUrl: "https://obserwator.rops.krakow.pl/trendanalysis/135",
  points: [
    { id: "malopolska", label: "Małopolska", value: 1.15 },
    { id: "polska", label: "Polska", value: 1.1 },
  ],
};

test("fertility chart renders Polish values, year and source inside an accessible figure", () => {
  const html = renderToStaticMarkup(
    createElement(ObservatoryVisualizationCard, { visualization }),
  );
  assert.match(html, /<figure/);
  assert.match(html, /Współczynnik dzietności/);
  assert.match(html, /2024/);
  assert.match(html, /aria-label="Małopolska: 1,15"/);
  assert.match(html, /aria-label="Polska: 1,1"/);
  assert.ok(html.includes(visualization.sourceUrl));
  assert.doesNotMatch(html, /<iframe|<table/);
});

test("map resolves original county boundaries without sending polygon data in the answer", () => {
  const html = renderToStaticMarkup(
    createElement(ObservatoryVisualizationCard, {
      visualization: {
        ...visualization,
        indicatorId: 22,
        kind: "map",
        title: "Wskaźnik dostępności kin",
        sourceUrl: "https://obserwator.rops.krakow.pl/differenceanalysis/22",
        points: [{ id: "POW_1", label: "powiat bocheński", value: 598 }],
      },
    }),
  );
  assert.match(html, /<svg/);
  assert.match(html, /<path[^>]+d="M[^"]+/);
  assert.match(html, /role="button" tabindex="0"/);
  assert.match(html, /aria-label="powiat bocheński: 598"/);
});
