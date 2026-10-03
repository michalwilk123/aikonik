import type { AgentConfiguration } from "@/agents/configuration";
import { agentOutputSchema } from "@/agents/types";
import { systemPrompt } from "@/agents/wdrazanie-innowacji/prompt";
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
  outputSchema: agentOutputSchema,
  supportsArtifacts: true,
  prepareHistory: (history) =>
    projectAgentHistory(
      history,
      ["visualizations"],
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
