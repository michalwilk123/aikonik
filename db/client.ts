import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Per-request D1 client. Never memoize across requests: a binding captured
 * under one request's I/O context can fail in later requests.
 */
export function getDb() {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error("D1 binding `DB` is missing. Check wrangler.jsonc.");
  }
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;
