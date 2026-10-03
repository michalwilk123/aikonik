import type { AgentConfiguration } from "@/agents/configuration";
import { sources } from "@/agents/dodaj-pomysl/knowledge";
import { systemPrompt } from "@/agents/dodaj-pomysl/prompt";
import { agentOutputSchema } from "@/agents/types";
import { preserveAgentHistory } from "@/application/chat/context";

export const configuration = {
  prompt: systemPrompt,
  sources,
  outputSchema: agentOutputSchema,
  supportsArtifacts: true,
  prepareHistory: preserveAgentHistory,
  createTools: () => ({}),
} satisfies AgentConfiguration;
