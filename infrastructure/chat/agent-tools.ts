import type { AgentToolContext } from "@/agents/configuration";
import { makeInnovationTools } from "@/infrastructure/chat/innovation-tools";
import { makeObservatoryTools } from "@/infrastructure/chat/observatory-tool";

export { makeReportTool } from "@/infrastructure/chat/report-tool";

export function innovationTools(context: AgentToolContext) {
  return makeInnovationTools(context.onSources);
}

export function observatoryTools(context: AgentToolContext) {
  return makeObservatoryTools(context.onVisualization);
}
