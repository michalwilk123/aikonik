import type { SupportAnswer } from "@/domain/support-offer";

export interface SupportMatcher {
  match(
    query: string,
    history?: { role: "user" | "assistant"; content: string }[],
  ): Promise<SupportAnswer>;
}
