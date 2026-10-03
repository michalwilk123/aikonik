import type { SupportAnswer } from "@/domain/support-offer";

export interface SupportMatcher {
  match(query: string): Promise<SupportAnswer>;
}
