import { getCloudflareContext } from "@opennextjs/cloudflare";
import { makeFindSupport } from "@/application/use-cases/find-support";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeOpenRouterSupportMatcher } from "@/infrastructure/support/openrouter-support-matcher";

// Composition root: the only place that picks concrete adapters.
export async function findSupport(query: string) {
  const { env } = getCloudflareContext();
  const model = createChatModel(env.OPENROUTER_API_KEY ?? "");
  return makeFindSupport(makeOpenRouterSupportMatcher(model))(query);
}
