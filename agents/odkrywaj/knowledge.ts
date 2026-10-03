import source from "@/docs/research/sources/rops-2025-uslugi-spoleczne-diagnoza.notes.json";

export interface KnowledgeExcerpt {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  page?: number;
}

const normalize = (text: string) =>
  text
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l");

const stopWords = new Set([
  "jest",
  "jaki",
  "jakie",
  "jak",
  "czy",
  "dla",
  "sie",
  "mam",
  "oraz",
  "podaj",
  "chce",
  "szukam",
  "prosze",
  "potrzebuje",
  "mnie",
  "moje",
  "malopolska",
  "malopolsce",
  "krakow",
  "krakowie",
]);

/** Read-only local retrieval over verified excerpts; no network or write tools. */
export function retrieveKnowledge(query: string): KnowledgeExcerpt[] {
  const tokens = normalize(query).match(/[a-z0-9]+/g) ?? [];
  const terms = tokens.filter(
    (token) => token.length >= 3 && !stopWords.has(token),
  );
  const general = terms.some((term) =>
    ["raport", "dane", "zrodla", "badania"].includes(term),
  );

  return source.facts
    .map((fact) => {
      const keywords =
        fact.pdf_page === 25
          ? "senior starszy starosc starzenie populacja demografia 60 80"
          : "opieka opiekuncze uslugi wsparcie gmina senior starszy";
      const text = normalize(`${fact.section} ${fact.text_pl} ${keywords}`);
      const score = terms.reduce(
        (sum, term) => sum + Number(text.includes(term.slice(0, 5))),
        0,
      );
      return { fact, score };
    })
    .filter(({ score }) => score > 0 || general)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ fact }) => ({
      id: fact.id,
      title: source.title,
      url: source.download_url,
      excerpt: fact.text_pl,
      page: fact.pdf_page,
    }));
}
