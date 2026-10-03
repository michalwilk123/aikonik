import { makeFindSupport } from "@/application/use-cases/find-support";
import { hardcodedSupportMatcher } from "@/infrastructure/support/hardcoded-support-matcher";

// Composition root: the only place that picks concrete adapters.
export const findSupport = makeFindSupport(hardcodedSupportMatcher);
