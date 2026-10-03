import { readdir, readFile } from "node:fs/promises";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { makeD1ChatStore } from "@/infrastructure/chat/d1-store";

export async function testDatabase() {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      d1Databases: ["DB"],
      compatibilityDate: "2026-09-01",
    }),
  );
  const db = await mf.getD1Database("DB");
  const files = (await readdir("drizzle"))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const migration = await readFile(`drizzle/${file}`, "utf8");
    await db.batch(
      migration
        .split("--> statement-breakpoint")
        .filter((s) => s.trim())
        .map((s) => db.prepare(s)),
    );
  }
  return {
    db,
    store: makeD1ChatStore(db as unknown as D1Database),
    dispose: () => mf.dispose(),
  };
}
