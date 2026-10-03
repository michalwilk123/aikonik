import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ObservatoryVisualizationCard } from "@/agents/observatory-visualization";
import type { ObservatoryVisualization } from "@/domain/observatory";
import { COUNTY_PATHS } from "@/infrastructure/observatory/geometry";

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

test("map viewport centers and fits the county geometry with stroke padding", () => {
  const html = renderToStaticMarkup(
    createElement(ObservatoryVisualizationCard, {
      visualization: {
        ...visualization,
        kind: "map",
        points: Object.keys(COUNTY_PATHS).map((id) => ({
          id,
          label: id,
          value: 1,
        })),
      },
    }),
  );
  const viewBox = html.match(/viewBox="([^"]+)"/);
  assert.ok(viewBox);
  const [x, y, width, height] = viewBox[1].split(" ").map(Number);
  const vertices = [...html.matchAll(/\b[ML]([\d.]+) ([\d.]+)/g)].map(
    (match) => [Number(match[1]), Number(match[2])],
  );
  assert.ok(vertices.length > 100);
  const left = Math.min(...vertices.map(([x]) => x));
  const right = Math.max(...vertices.map(([x]) => x));
  const top = Math.min(...vertices.map(([, y]) => y));
  const bottom = Math.max(...vertices.map(([, y]) => y));
  assert.ok(left - x > 3 && x + width - right > 3);
  assert.ok(top - y > 3 && y + height - bottom > 3);
  assert.ok(Math.abs((left + right) / 2 - (x + width / 2)) < 1);
  assert.ok(Math.abs((top + bottom) / 2 - (y + height / 2)) < 1);
  assert.ok((right - left) / width > 0.9);
  assert.ok((bottom - top) / height > 0.9);
  assert.match(html, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(html, /<label[^>]*>Wybierz powiat<select/);
  assert.equal((html.match(/<option value="POW_/g) ?? []).length, 22);
});
