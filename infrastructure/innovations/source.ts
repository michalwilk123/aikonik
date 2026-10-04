import type { AgentSource } from "@/agents/types";
import catalog from "@/data/rops/catalog.json";
import {
  type ChallengeMap,
  videosForSources,
} from "@/infrastructure/innovations/search";
import {
  type InnovationLoader,
  loadInnovations,
} from "@/infrastructure/innovations/store";

export const socialChallenges: ChallengeMap = {
  title: "Mapa wyzwań społecznych",
  url: catalog.challengeMap.url,
  pages: catalog.challengeMap.pages,
};

export async function getInnovationVideos(
  sources: AgentSource[],
  load: InnovationLoader = loadInnovations,
) {
  if (!sources.some((source) => source.id.startsWith("innovation:"))) return [];
  return videosForSources(await load(), sources);
}

export async function resolveInnovationSources(
  ids: string[],
  load: InnovationLoader = loadInnovations,
): Promise<AgentSource[]> {
  const requested = new Set(ids.slice(0, 8));
  const sources: AgentSource[] = [];
  const projects = ids.some((id) => id.startsWith("innovation:"))
    ? await load()
    : [];
  for (const project of projects) {
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
