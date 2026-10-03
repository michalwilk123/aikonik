import type { AgentSource } from "@/agents/types";
import catalog from "@/data/rops/catalog.json";
import {
  type ChallengeMap,
  type Innovation,
  videosForSources,
} from "@/infrastructure/innovations/search";

// Imported only by the server-side chat tools; no network or database scan at query time.
export const innovations: Innovation[] = catalog.projects.map((project) => ({
  ...project,
  pdfs: project.pdfs.map((pdf) => ({
    url: pdf.url,
    pages: "pages" in pdf ? (pdf.pages ?? []) : [],
  })),
}));
export const socialChallenges: ChallengeMap = {
  title: "Mapa wyzwań społecznych",
  url: catalog.challengeMap.url,
  pages: catalog.challengeMap.pages,
};

export function getInnovationVideos(sources: AgentSource[]) {
  return videosForSources(innovations, sources);
}

export function resolveInnovationSources(ids: string[]): AgentSource[] {
  const requested = new Set(ids.slice(0, 8));
  const sources: AgentSource[] = [];
  for (const project of innovations) {
    const pageId = `innovation:${project.id}:page`;
    if (requested.has(pageId))
      sources.push({
        id: pageId,
        title: project.title,
        url: project.url,
        excerpt: project.description.slice(0, 6000),
      });
    project.pdfs.forEach((pdf, index) => {
      for (const page of pdf.pages) {
        const id = `innovation:${project.id}:pdf:${index}:page:${page.page}`;
        if (requested.has(id))
          sources.push({
            id,
            title: `${project.title} — materiał PDF`,
            url: `${pdf.url}#page=${page.page}`,
            page: page.page,
            excerpt: page.text.slice(0, 1800),
          });
      }
    });
  }
  for (const page of socialChallenges.pages) {
    const id = `social-challenges:page:${page.page}`;
    if (requested.has(id))
      sources.push({
        id,
        title: socialChallenges.title,
        url: `${socialChallenges.url}#page=${page.page}`,
        page: page.page,
        excerpt: page.text.slice(0, 1800),
      });
  }
  return sources;
}
