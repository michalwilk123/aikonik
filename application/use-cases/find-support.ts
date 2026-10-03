import type { SupportMatcher } from "@/application/ports/support-matcher";
import type { SupportAnswer } from "@/domain/support-offer";

class EmptyQueryError extends Error {
  constructor() {
    super("Query must not be empty");
    this.name = "EmptyQueryError";
  }
}

export function makeFindSupport(matcher: SupportMatcher) {
  return async function findSupport(query: string): Promise<SupportAnswer> {
    const trimmed = query.trim();
    if (!trimmed) throw new EmptyQueryError();
    return matcher.match(trimmed);
  };
}
