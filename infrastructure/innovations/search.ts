import type { AgentSource } from "@/agents/types";
import { getYouTubeVideoId } from "@/domain/youtube";

type PdfPage = { page: number; text: string };
export type Innovation = {
  id: string;
  title: string;
  url: string;
  categories: string[];
  description: string;
  pdfs: { url: string; pages: PdfPage[] }[];
  videos: string[];
};
export type ChallengeMap = { title: string; url: string; pages: PdfPage[] };

const stopWords = new Set(
  "a aby albo ale by chce chca dla do gdy i jak jest mam ma mi mnie moze na nie o od oraz po pod prosze przy sa sie to w we z za ze ktory ktora ktore co jakiego osoba osoby problem problemy pomoc potrzebuje program programy wiecej".split(
    " ",
  ),
);
const synonyms = [
  ["samot", "osamot", "izolac", "towarz", "kontakt", "relac"],
  ["senior", "starsz", "starosc", "stary", "emeryt", "wiek"],
  ["niepelnospraw", "niepelnosprawnosc", "dostepnosc"],
  ["opiek", "opiekun"],
  ["bezdom", "mieszkani"],
  ["bezrobot", "zatrudn", "prac"],
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stem(word: string) {
  // Conservative Polish inflection handling; prefixes below handle domain terms.
  const group = synonyms.find((terms) =>
    terms.some((term) => word.startsWith(term)),
  );
  if (group) return group[0];
  return word.length > 5
    ? word.replace(
        /(?:ami|ach|ego|owej|owych|owie|ow|em|om|ie|ia|u|y|a|e|i)$/,
        "",
      )
    : word;
}

function tokens(text: string) {
  return normalize(text)
    .split(" ")
    .filter((word) => word.length > 1 && !stopWords.has(word))
    .map(stem);
}

type Indexed = { text: string; counts: Map<string, number>; length: number };
const indexes = new Map<string, Indexed>();
function index(text: string): Indexed {
  const cached = indexes.get(text);
  if (cached) return cached;
  const terms = tokens(text);
  const counts = new Map<string, number>();
  for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1);
  const document = { text, counts, length: terms.length };
  indexes.set(text, document);
  return document;
}

function rank<T>(items: T[], query: string, getText: (item: T) => string) {
  const terms = [...new Set(tokens(query))];
  if (!terms.length) return [];
  const documents = items.map((item) => ({
    item,
    document: index(getText(item)),
  }));
  const averageLength =
    documents.reduce((total, entry) => total + entry.document.length, 0) /
    (documents.length || 1);
  const frequencies = new Map(
    terms.map((term) => [
      term,
      documents.filter(({ document }) => document.counts.has(term)).length,
    ]),
  );
  return documents
    .map(({ item, document }) => ({
      item,
      score: terms.reduce((score, term) => {
        const frequency = document.counts.get(term) ?? 0;
        if (!frequency) return score;
        const df = frequencies.get(term) ?? 0;
        const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
        return (
          score +
          (idf * (frequency * 2.2)) /
            (frequency +
              1.2 * (0.25 + (0.75 * document.length) / (averageLength || 1)))
        );
      }, 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

function excerpt(text: string, query: string, max = 1800) {
  if (text.length <= max) return text;
  const terms = new Set(tokens(query));
  const paragraphs = text.split(/\n+/).filter(Boolean);
  const ranked = rank(paragraphs, query, (paragraph) => paragraph);
  const selected = ranked[0]?.item ?? text;
  if (selected.length <= max) return selected;
  const words = selected.split(/\s+/);
  const position = words.findIndex((word) =>
    tokens(word).some((term) => terms.has(term)),
  );
  return words
    .slice(Math.max(0, position - 30))
    .join(" ")
    .slice(0, max);
}

function projectSource(project: Innovation, query = ""): AgentSource {
  return {
    id: `innovation:${project.id}:page`,
    title: project.title,
    url: project.url,
    excerpt: excerpt(project.description, query),
  };
}

export function searchInnovations(
  projects: Innovation[],
  query: string,
  limit = 5,
) {
  const exact = normalize(query);
  const knownProject = projects.find(
    (project) => project.id === query || normalize(project.title) === exact,
  );
  // Commercial enrichment is outside this social innovation catalog. Incidental
  // mentions of project budgets must not become purported financial advice.
  if (
    !knownProject &&
    /(bogat|wzbogac|pomnoz.*(?:pienied|majatek)|zysk.*inwestyc)/.test(exact) &&
    !/(ubost|bied|ubog|zadluz|bezrob|wyklucz|niepelnospraw)/.test(exact)
  )
    return [];
  const ranked = rank(
    projects,
    query,
    (project) =>
      `${project.title} ${project.title} ${project.categories.join(" ")} ${project.description}`,
  );
  const pdfHits = rank(
    projects.filter((project) => project.pdfs.length),
    query,
    (project) =>
      project.pdfs
        .flatMap((pdf) => pdf.pages.map((page) => page.text))
        .join("\n"),
  );
  for (const hit of pdfHits) {
    const match = ranked.find(({ item }) => item.id === hit.item.id);
    if (match) match.score += hit.score * 0.3;
    else ranked.push({ item: hit.item, score: hit.score * 0.3 });
  }
  for (const item of ranked)
    if (normalize(item.item.title) === exact || item.item.id === query)
      item.score += 1000;
  const byId = knownProject;
  if (byId && !ranked.some(({ item }) => item.id === byId.id))
    ranked.unshift({ item: byId, score: 1000 });
  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(5, Math.max(1, limit)))
    .map(({ item }) => ({
      projectId: item.id,
      title: item.title,
      categories: item.categories,
      source: projectSource(item, query),
    }));
}

export function readInnovation(
  projects: Innovation[],
  projectId: string,
  question = "",
) {
  const project = projects.find((entry) => entry.id === projectId);
  if (!project)
    return { error: "unknown_project", sources: [] as AgentSource[] };
  const pages = project.pdfs.flatMap((pdf, pdfIndex) =>
    pdf.pages
      .filter((page) => page.text.trim())
      .map((page) => ({ ...page, pdfIndex, url: pdf.url })),
  );
  const selected = question
    ? rank(pages, question, (page) => page.text)
        .slice(0, 3)
        .map(({ item }) => item)
    : pages.slice(0, 3);
  const overview = projectSource(project, question);
  // Preserve the entry's problem, audience and implementation sections together.
  overview.excerpt = project.description.slice(0, 6000);
  const sources: AgentSource[] = [
    overview,
    ...selected.map((page) => ({
      id: `innovation:${project.id}:pdf:${page.pdfIndex}:page:${page.page}`,
      title: `${project.title} — materiał PDF`,
      url: `${page.url}#page=${page.page}`,
      page: page.page,
      excerpt: excerpt(page.text, question),
    })),
  ];
  return {
    projectId,
    title: project.title,
    categories: project.categories,
    sources,
    videos: project.videos.slice(0, 3),
    limitation:
      "Opis modelu innowacji nie potwierdza aktualnego naboru, finansowania ani dostępności usługi. Wybrane fragmenty PDF nie są pełnym dokumentem.",
  };
}

export function readSocialChallenges(map: ChallengeMap, query: string) {
  const pages = rank(map.pages, query, (page) => page.text).slice(0, 3);
  return {
    sources: pages.map(({ item }) => ({
      id: `social-challenges:page:${item.page}`,
      title: map.title,
      url: `${map.url}#page=${item.page}`,
      page: item.page,
      excerpt: excerpt(item.text, query),
    })),
    limitation:
      "Mapa wyzwań jest ramą diagnozy potrzeb społecznych. Nie stanowi oceny skuteczności ani rankingu poszczególnych innowacji.",
  };
}

export function videosForSources(
  projects: Innovation[],
  sources: AgentSource[],
) {
  const videos: { url: string; title: string; projectId: string }[] = [];
  for (const project of projects) {
    if (
      !sources.some(
        (source) =>
          (source.id === `innovation:${project.id}:page` &&
            source.url === project.url) ||
          project.pdfs.some((pdf, pdfIndex) =>
            pdf.pages.some(
              (page) =>
                source.id ===
                  `innovation:${project.id}:pdf:${pdfIndex}:page:${page.page}` &&
                source.url === `${pdf.url}#page=${page.page}`,
            ),
          ),
      )
    )
      continue;
    for (const url of project.videos)
      if (getYouTubeVideoId(url) && !videos.some((video) => video.url === url))
        videos.push({ url, title: project.title, projectId: project.id });
  }
  return videos.slice(0, 3);
}
