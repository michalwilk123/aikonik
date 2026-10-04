import type { Innovation } from "@/infrastructure/innovations/search";

export type InnovationLoader = () => Promise<Innovation[]>;

type InnovationRow = {
  id: string;
  title: string;
  url: string;
  description: string;
  categories: string;
  videos: string;
  pdfs: string;
};

export async function listInnovations(db: D1Database): Promise<Innovation[]> {
  const { results } = await db
    .prepare(`SELECT i.id, i.title, i.url, i.description, i.pdfs,
        (SELECT json_group_array(value) FROM (SELECT value FROM innovations_categories WHERE parent_id = i.id ORDER BY "order")) AS categories,
        (SELECT json_group_array(json_object('url', url)) FROM (SELECT url FROM innovations_videos WHERE _parent_id = i.id ORDER BY _order)) AS videos
       FROM innovations i ORDER BY i.title, i.id`)
    .all<InnovationRow>();
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    categories: JSON.parse(row.categories),
    videos: JSON.parse(row.videos).map((video: { url: string }) => video.url),
    pdfs: JSON.parse(row.pdfs),
  }));
}

export async function loadInnovations(): Promise<Innovation[]> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  return listInnovations(env.DB);
}
