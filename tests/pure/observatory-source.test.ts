import assert from "node:assert/strict";
import { test } from "node:test";
import { loadObservatoryVisualization } from "@/infrastructure/observatory/source";

const year =
  '<select id="differenceanalysis_year"><option value="2024" selected="selected">2024</option><option value="2023">2023</option></select>';
const originalFetch = globalThis.fetch;

test("map fetch carries isolated source session and returns original county values without polygon payload", async () => {
  const cookies: Array<string | null> = [];
  globalThis.fetch = (async (url, init) => {
    cookies.push(new Headers(init?.headers).get("cookie"));
    if (String(url).endsWith("flashdata.xml")) {
      return new Response(
        '<pointerData><region id="POW_1" name="powiat bocheński">598</region><region id="POW_8" name="Kraków">67</region></pointerData>',
      );
    }
    return new Response(year, {
      headers: { "set-cookie": "rops_cookie=isolated; path=/" },
    });
  }) as typeof fetch;
  try {
    const result = await loadObservatoryVisualization({
      indicatorId: 22,
      kind: "map",
    });
    assert.equal(result.title, "Wskaźnik dostępności kin");
    assert.deepEqual(result.points, [
      { id: "POW_1", label: "powiat bocheński", value: 598 },
      { id: "POW_8", label: "Kraków", value: 67 },
    ]);
    assert.deepEqual(cookies, [null, "rops_cookie=isolated"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fertility follows session redirect and posts requested year before reading province and Poland values", async () => {
  const requests: Array<{ url: string; cookie: string | null; body: string }> =
    [];
  globalThis.fetch = (async (url, init) => {
    requests.push({
      url: String(url),
      cookie: new Headers(init?.headers).get("cookie"),
      body: String(init?.body ?? ""),
    });
    if (String(url).includes("differenceanalysis")) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/trendanalysis/135",
          "set-cookie": "rops_cookie=fertility; path=/",
        },
      });
    }
    return new Response(
      year.replace("differenceanalysis_year", "trendanalysis_year") +
        '<canvas data-chart-child-region="województwo małopolskie" data-chart-parent-region="Polska"></canvas><script>var myChartValuesmyChartTA = [1.20];var myChartValues2myChartTA = [1.16];</script>',
    );
  }) as typeof fetch;
  try {
    const result = await loadObservatoryVisualization({
      indicatorId: 135,
      kind: "bar",
      year: 2023,
    });
    assert.equal(result.year, 2023);
    assert.equal(result.title, "Współczynnik dzietności");
    assert.deepEqual(
      result.points.map((point) => point.value),
      [1.2, 1.16],
    );
    assert.equal(requests[1].cookie, "rops_cookie=fertility");
    assert.equal(requests[2].body, "trendanalysis%5Byear%5D%5B%5D=2023");
    await assert.rejects(
      loadObservatoryVisualization({ indicatorId: 135, kind: "map" }),
      /Mapa nie jest dostępna/,
    );
    await assert.rejects(
      loadObservatoryVisualization({
        indicatorId: 135,
        kind: "bar",
        year: 2099,
      }),
      /nie są dostępne/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
