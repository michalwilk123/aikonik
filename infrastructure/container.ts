import { makeFindSupport } from "@/application/use-cases/find-support";
import { makeGuideIdea } from "@/application/use-cases/guide-idea";
import { mockIdeaGuide } from "@/infrastructure/idea/mock-idea-guide";
import { hardcodedSupportMatcher } from "@/infrastructure/support/hardcoded-support-matcher";

// Composition root: the only place that picks concrete adapters.
export const findSupport = makeFindSupport(hardcodedSupportMatcher);
export const guideIdea = makeGuideIdea(mockIdeaGuide);
