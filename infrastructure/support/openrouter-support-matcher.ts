import { generateText, type LanguageModel, Output } from "ai";
import type { SupportMatcher } from "@/application/ports/support-matcher";
import { supportAnswerSchema } from "@/domain/support-offer";
import { CHAT_INSTRUCTIONS } from "@/infrastructure/chat/prompt";

export function makeOpenRouterSupportMatcher(
  model: LanguageModel,
): SupportMatcher {
  return {
    async match(query, history = []) {
      const { output } = await generateText({
        model,
        instructions: CHAT_INSTRUCTIONS,
        messages: [...history, { role: "user", content: query }],
        output: Output.object({ schema: supportAnswerSchema }),
        maxOutputTokens: 4000,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(30000),
      });
      return output;
    },
  };
}
