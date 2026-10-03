import type { AgentConfiguration } from "@/agents/configuration";
import { systemPrompt } from "@/agents/odkrywaj/prompt";
import { readOnlyAgentOutputSchema } from "@/agents/types";
import { projectAgentHistory } from "@/application/chat/context";
import { MATCHING_INSTRUCTIONS } from "@/infrastructure/chat/agent-instructions";
import { innovationTools } from "@/infrastructure/chat/agent-tools";
import {
  getInnovationVideos,
  resolveInnovationSources,
} from "@/infrastructure/innovations/source";

export const configuration = {
  prompt: [systemPrompt, MATCHING_INSTRUCTIONS].join("\n"),
  sources: [],
  outputSchema: readOnlyAgentOutputSchema,
  supportsArtifacts: false,
  prepareHistory: (history) =>
    projectAgentHistory(
      history,
      ["artifact", "visualizations"],
      (id) =>
        id.startsWith("innovation:") || id.startsWith("social-challenges:"),
    ),
  resolveHistorySources: resolveInnovationSources,
  getVideos: getInnovationVideos,
  createTools(context) {
    const tools = innovationTools(context);
    return {
      search_innovations: tools.search_innovations,
      read_innovation: tools.read_innovation,
      read_social_challenges: tools.read_social_challenges,
    };
  },
} satisfies AgentConfiguration;
