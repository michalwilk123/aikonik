import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentSource } from "@/agents/types";
import {
  innovationReadSchema,
  innovationSearchSchema,
  makeInnovationTools,
} from "@/infrastructure/chat/innovation-tools";
import {
  type Innovation,
  readInnovation,
  readSocialChallenges,
  searchInnovations,
  videosForSources,
} from "@/infrastructure/innovations/search";
import {
  getInnovationVideos,
  resolveInnovationSources,
  socialChallenges,
} from "@/infrastructure/innovations/source";
import { innovations } from "@/tests/helpers/innovations";

const options = { toolCallId: "fixture", messages: [], context: {} };

test("real catalog finds lonely seniors and never converts commercial enrichment into a social need", () => {
  const candidates = searchInnovations(
    innovations,
    "starsza osoba jest samotna",
  );
  assert.ok(candidates.length > 0 && candidates.length <= 5);
  assert.ok(
    candidates.some((candidate) => /senior|starszych/i.test(candidate.title)),
  );
  assert.deepEqual(
    searchInnovations(innovations, "bogaty chce więcej pieniędzy"),
    [],
  );
  assert.deepEqual(searchInnovations(innovations, "xyzqwertyunfindable"), []);
  assert.deepEqual(searchInnovations(innovations, "i w oraz"), []);
  assert.ok(
    searchInnovations(innovations, "samotna matka chce zarabiać więcej")
      .length > 0,
  );
  assert.ok(
    searchInnovations(innovations, "jak pomóc seniorom znaleźć pracę zarobkową")
      .length > 0,
  );
});

test("exact names and project identifiers resolve the requested project", () => {
  for (const project of innovations.slice(0, 10)) {
    assert.equal(
      searchInnovations(innovations, project.title, 1)[0]?.projectId,
      project.id,
    );
    assert.equal(
      searchInnovations(innovations, project.id, 1)[0]?.projectId,
      project.id,
    );
  }
});

test("PDF-only information is searchable and reading stays within a bounded citation budget", () => {
  const project: Innovation = {
    id: "fixture",
    title: "Model lokalny",
    url: "https://rops.krakow.pl/fixture",
    categories: [],
    description: "Działania sąsiedzkie. ".repeat(1000),
    videos: [],
    pdfs: [
      {
        url: "https://rops.krakow.pl/fixture.pdf",
        pages: [
          { page: 1, text: "Ogólny wstęp." },
          {
            page: 7,
            text: `${"Ogólny opis. ".repeat(1000)} Hortiterapia i ogrodnictwo.`,
          },
        ],
      },
    ],
  };
  assert.equal(
    searchInnovations([project], "hortiterapia")[0]?.projectId,
    "fixture",
  );
  const result = readInnovation([project], "fixture", "hortiterapia");
  assert.ok(!("error" in result));
  assert.equal(result.sources.length, 2);
  assert.equal(result.sources[1].page, 7);
  assert.equal(
    result.sources[1].url,
    "https://rops.krakow.pl/fixture.pdf#page=7",
  );
  assert.equal(result.sources[1].id, "innovation:fixture:pdf:0:page:7");
  assert.match(result.sources[1].excerpt, /Hortiterapia/);
  assert.ok(result.sources[0].excerpt.length <= 6000);
  assert.ok(result.sources[1].excerpt.length <= 1800);
  assert.deepEqual(readInnovation([project], "invented").sources, []);
});

test("challenge map returns actual bounded PDF pages and explicitly excludes efficacy scoring", () => {
  const result = readSocialChallenges(socialChallenges, "samotność seniorów");
  assert.ok(result.sources.some((source) => source.page === 41));
  assert.ok(result.sources.length <= 3);
  for (const source of result.sources) {
    assert.ok(
      source.page &&
        socialChallenges.pages.some((page) => page.page === source.page),
    );
    assert.ok(source.excerpt.length <= 1800);
    assert.equal(source.url, `${socialChallenges.url}#page=${source.page}`);
  }
  assert.match(result.limitation, /Nie stanowi oceny skuteczności/);
  assert.deepEqual(
    readSocialChallenges(socialChallenges, "xyzqwertyunfindable").sources,
    [],
  );
});

test("tools register only retrieved sources and reject URLs or unbounded inputs", async () => {
  assert.equal(
    innovationSearchSchema.safeParse({ query: "senior", limit: 6 }).success,
    false,
  );
  assert.equal(
    innovationSearchSchema.safeParse({ query: "x".repeat(501) }).success,
    false,
  );
  assert.equal(
    innovationReadSchema.safeParse({
      projectId: "fixture",
      url: "https://example.com",
    }).success,
    false,
  );
  const published: AgentSource[] = [];
  const tools = makeInnovationTools(
    (sources) => published.push(...sources),
    async () => innovations,
  );
  const search = await tools.search_innovations.execute?.(
    { query: "samotność seniorów", limit: 2 },
    options,
  );
  assert.ok(search && "candidates" in search);
  assert.equal(published.length, 2);
  assert.deepEqual(
    published.map((source) => source.id),
    search.candidates.map((candidate) => candidate.source.id),
  );
  const before = published.length;
  const unknown = await tools.read_innovation.execute?.(
    { projectId: "invented" },
    options,
  );
  assert.ok(unknown && "error" in unknown);
  assert.equal(published.length, before);
});

test("videos require known cited project sources and valid YouTube links", async () => {
  const project = innovations.find((entry) =>
    entry.videos.some((url) => url.includes("youtu")),
  );
  assert.ok(project);
  const source = (
    await resolveInnovationSources(
      [`innovation:${project.id}:page`],
      async () => innovations,
    )
  )[0];
  assert.ok(
    (await getInnovationVideos([source], async () => innovations)).length > 0,
  );
  assert.deepEqual(
    await getInnovationVideos(
      [{ ...source, id: "innovation:invented:page" }],
      async () => innovations,
    ),
    [],
  );
  assert.deepEqual(
    await getInnovationVideos(
      [{ ...source, url: "https://example.com" }],
      async () => innovations,
    ),
    [],
  );
  assert.deepEqual(
    videosForSources(
      [{ ...project, videos: ["https://example.com/video"] }],
      [source],
    ),
    [],
  );
  assert.deepEqual(
    await resolveInnovationSources(
      ["innovation:invented:page", "social-challenges:page:999"],
      async () => innovations,
    ),
    [],
  );
});
