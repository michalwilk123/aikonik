import type { ObservatoryVisualization } from "@/domain/observatory";
import { OBSERVATORY_INDICATORS } from "@/infrastructure/observatory/catalog";
import { COUNTY_PATHS } from "@/infrastructure/observatory/geometry";

const ORIGIN = "https://obserwator.rops.krakow.pl";

function decode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function chartArray(html: string, name: string): unknown[] {
  const match = html.match(
    new RegExp(`var\\s+${name}\\s*=\\s*(\\[[^;]*\\])\\s*;`),
  );
  if (!match)
    throw new Error(
      "Obserwator nie udostępnił danych wykresu dla tego wskaźnika.",
    );
  const parsed: unknown = JSON.parse(match[1]);
  if (!Array.isArray(parsed))
    throw new Error("Nieprawidłowe dane wykresu Obserwatora.");
  return parsed;
}

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", ".").replace("%", ""));
  return Number.isFinite(number) ? number : null;
}

/** Each visualization gets an isolated upstream session: the site's XML depends on its cookie. */
function sourceSession(signal?: AbortSignal) {
  const cookies = new Map<string, string>();
  return async (
    path: string,
    init?: RequestInit,
  ): Promise<{ html: string; url: string }> => {
    let url = new URL(path, ORIGIN).href;
    let method = init?.method ?? "GET";
    let body = init?.body;
    for (let redirect = 0; redirect < 6; redirect++) {
      if (new URL(url).origin !== ORIGIN)
        throw new Error("Nieprawidłowe przekierowanie Obserwatora.");
      const headers = new Headers(init?.headers);
      if (cookies.size)
        headers.set(
          "cookie",
          [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
        );
      const response = await fetch(url, {
        ...init,
        method,
        body,
        headers,
        redirect: "manual",
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(12_000)])
          : AbortSignal.timeout(12_000),
      });
      const cookieHeaders =
        typeof response.headers.getSetCookie === "function"
          ? response.headers.getSetCookie()
          : [response.headers.get("set-cookie") ?? ""];
      for (const cookie of cookieHeaders) {
        const pair = cookie.split(";")[0];
        const equals = pair.indexOf("=");
        if (equals > 0)
          cookies.set(pair.slice(0, equals), pair.slice(equals + 1));
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location)
          throw new Error("Obserwator zwrócił nieprawidłowe przekierowanie.");
        url = new URL(location, url).href;
        if ([301, 302, 303].includes(response.status)) {
          method = "GET";
          body = undefined;
        }
        continue;
      }
      if (!response.ok)
        throw new Error(
          "Dane Obserwatora są chwilowo niedostępne. Spróbuj ponownie.",
        );
      return { html: await response.text(), url };
    }
    throw new Error("Obserwator zwrócił zbyt wiele przekierowań.");
  };
}

export async function loadObservatoryVisualization(input: {
  indicatorId: number;
  kind: "map" | "bar";
  year?: number;
  signal?: AbortSignal;
}): Promise<ObservatoryVisualization> {
  const indicator = OBSERVATORY_INDICATORS.find(
    (entry) => entry.id === input.indicatorId,
  );
  if (!indicator)
    throw new Error(
      "Nieznany wskaźnik Obserwatora. Wybierz wskaźnik z katalogu.",
    );
  const request = sourceSession(input.signal);
  let page = await request(`/differenceanalysis/${indicator.id}`);
  const trend = new URL(page.url).pathname.startsWith("/trendanalysis");
  if (trend && input.kind === "map") {
    throw new Error(
      `Mapa nie jest dostępna dla wskaźnika „${indicator.title}”. Obserwator udostępnia go na poziomie województwa; użyj wykresu słupkowego.`,
    );
  }
  const yearOptions = page.html.match(
    /<select[^>]*id="(?:differenceanalysis|trendanalysis)_year"[^>]*>([\s\S]*?)<\/select>/,
  )?.[1];
  const years = [...(yearOptions ?? "").matchAll(/<option value="(\d+)"/g)].map(
    (match) => Number(match[1]),
  );
  const selected = yearOptions?.match(/<option value="(\d+)" selected=/)?.[1];
  const year = input.year ?? Number(selected ?? years[0]);
  if (!Number.isInteger(year) || !years.includes(year))
    throw new Error(
      `Dane dla roku ${year} nie są dostępne. Dostępne lata: ${years.join(", ")}.`,
    );
  if (year !== Number(selected)) {
    const form = new URLSearchParams();
    form.set(
      trend ? "trendanalysis[year][]" : "differenceanalysis[year]",
      String(year),
    );
    if (!trend) form.set("differenceanalysis[regions]", "-1");
    page = await request(trend ? "/trendanalysis" : "/differenceanalysis", {
      method: "POST",
      body: form,
    });
  }
  const result: ObservatoryVisualization = {
    indicatorId: indicator.id,
    kind: input.kind,
    title: indicator.title,
    year,
    sourceUrl: `${ORIGIN}/${trend ? "trendanalysis" : "differenceanalysis"}/${indicator.id}`,
    points: [],
  };
  if (input.kind === "map") {
    const xml = (await request("/differenceanalysis/flashdata.xml")).html;
    result.points = [
      ...xml.matchAll(/<region\s+([^>]+)>([^<]*)<\/region>/g),
    ].flatMap((match) => {
      const id = match[1].match(/\bid="([^"]+)"/)?.[1];
      const label = match[1].match(/\bname="([^"]+)"/)?.[1];
      if (!id || !label || !COUNTY_PATHS[id]) return [];
      return [
        {
          id,
          label: decode(label),
          value: numeric(decode(match[2]).replace("%25", "%")),
        },
      ];
    });
    result.points.sort(
      (a, b) =>
        Number(["POW_8", "POW_9", "POW_10"].includes(a.id)) -
        Number(["POW_8", "POW_9", "POW_10"].includes(b.id)),
    );
  } else if (trend) {
    const values = chartArray(page.html, "myChartValuesmyChartTA");
    const parent = chartArray(page.html, "myChartValues2myChartTA");
    result.points = [
      {
        id: "malopolska",
        label: decode(
          page.html.match(/data-chart-child-region="([^"]+)"/)?.[1] ??
            "województwo małopolskie",
        ),
        value: numeric(values[0]),
      },
      {
        id: "polska",
        label: decode(
          page.html.match(/data-chart-parent-region="([^"]+)"/)?.[1] ??
            "Polska",
        ),
        value: numeric(parent[0]),
      },
    ];
  } else {
    const labels = chartArray(page.html, "myChartLabelsmyChart0");
    const values = chartArray(page.html, "myChartValuesmyChart0");
    if (labels.length !== values.length)
      throw new Error("Niekompletne dane wykresu Obserwatora.");
    result.points = labels.map((label, index) => ({
      id: `POW_${index + 1}`,
      label: String(label),
      value: numeric(values[index]),
    }));
  }
  if (
    !result.points.length ||
    result.points.every((point) => point.value === null)
  )
    throw new Error("Brak danych dla wybranego wskaźnika i roku.");
  if (page.html.includes('data-chart-percent="true"')) result.unit = "%";
  return result;
}
