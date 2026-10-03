import type { AgentConfiguration } from "@/agents/configuration";
import { retrieveKnowledge } from "@/agents/odkrywaj/knowledge";
import { readOnlyAgentOutputSchema } from "@/agents/types";
import { systemPrompt } from "@/agents/wiedza/prompt";
import { projectAgentHistory } from "@/application/chat/context";
import {
  KNOWLEDGE_INSTRUCTIONS,
  OBSERVATORY_INSTRUCTIONS,
  REPORT_INSTRUCTIONS,
} from "@/infrastructure/chat/agent-instructions";
import {
  innovationTools,
  makeReportTool,
  observatoryTools,
} from "@/infrastructure/chat/agent-tools";
import { resolveInnovationSources } from "@/infrastructure/innovations/source";

export const configuration = {
  prompt: [
    systemPrompt,
    REPORT_INSTRUCTIONS,
    OBSERVATORY_INSTRUCTIONS,
    KNOWLEDGE_INSTRUCTIONS,
  ].join("\n"),
  sources: retrieveKnowledge("raport"),
  outputSchema: readOnlyAgentOutputSchema,
  supportsArtifacts: false,
  prepareHistory: (history) =>
    projectAgentHistory(
      history,
      ["artifact", "videos"],
      (id) => !id.startsWith("innovation:"),
    ),
  resolveHistorySources: (ids) =>
    resolveInnovationSources(
      ids.filter((id) => id.startsWith("social-challenges:")),
    ),
  createTools(context) {
    const challenges = innovationTools(context);
    const charts = observatoryTools(context);
    return {
      read_report: makeReportTool(),
      read_social_challenges: challenges.read_social_challenges,
      show_map: charts.show_map,
      show_bar_chart: charts.show_bar_chart,
    };
  },
} satisfies AgentConfiguration;
