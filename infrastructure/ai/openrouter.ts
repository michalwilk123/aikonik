import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { MODEL_ID } from "@/domain/chat/model";

export { MODEL_ID } from "@/domain/chat/model";

// Shared by every model-backed feature. Never silently fall back to another model.

export function createChatModel(apiKey: string, fetcher?: typeof fetch) {
  if (!apiKey.trim()) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }
  const openrouter = createOpenRouter({ apiKey, fetch: fetcher });
  return openrouter(MODEL_ID, {
    provider: { require_parameters: true },
    extraBody: { reasoning: { effort: "minimal" } },
  });
}
