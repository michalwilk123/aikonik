import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Shared by every model-backed feature. Never silently fall back to another model.
export const MODEL_ID = "deepseek/deepseek-v4.1-flash";

export function createChatModel(apiKey: string, fetcher?: typeof fetch) {
  if (!apiKey.trim()) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }
  const openrouter = createOpenRouter({ apiKey, fetch: fetcher });
  return openrouter(MODEL_ID, { provider: { require_parameters: true } });
}
