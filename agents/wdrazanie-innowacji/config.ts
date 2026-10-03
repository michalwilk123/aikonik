import type { AgentConfiguration } from "@/agents/configuration";
import { agentOutputSchema } from "@/agents/types";
import { sources } from "@/agents/wdrazanie-innowacji/knowledge";
import { systemPrompt } from "@/agents/wdrazanie-innowacji/prompt";
import { preserveAgentHistory } from "@/application/chat/context";
import {
  OBSERVATORY_INSTRUCTIONS,
  REPORT_INSTRUCTIONS,
} from "@/infrastructure/chat/agent-instructions";
import {
  makeReportTool,
  observatoryTools,
} from "@/infrastructure/chat/agent-tools";

export const configuration = {
  prompt: [systemPrompt, REPORT_INSTRUCTIONS, OBSERVATORY_INSTRUCTIONS].join(
    "\n",
  ),
  sources,
  outputSchema: agentOutputSchema,
  supportsArtifacts: true,
  prepareHistory: preserveAgentHistory,
  createTools(context) {
    const charts = observatoryTools(context);
    return {
      read_report: makeReportTool(),
      show_map: charts.show_map,
      show_bar_chart: charts.show_bar_chart,
    };
  },
} satisfies AgentConfiguration;
