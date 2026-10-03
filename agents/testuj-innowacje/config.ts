import type { AgentConfiguration } from "@/agents/configuration";
import { sources } from "@/agents/testuj-innowacje/knowledge";
import { systemPrompt } from "@/agents/testuj-innowacje/prompt";
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
