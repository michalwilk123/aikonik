import type { AgentConfiguration } from "@/agents/configuration";
import { sources } from "@/agents/dodaj-pomysl/knowledge";
import { systemPrompt } from "@/agents/dodaj-pomysl/prompt";
import { submissionAgentOutputSchema } from "@/agents/types";
import { preserveAgentHistory } from "@/application/chat/context";

export const configuration = {
  prompt: systemPrompt,
  sources,
  outputSchema: submissionAgentOutputSchema,
  supportsArtifacts: true,
  prepareHistory: preserveAgentHistory,
  createTools: () => ({}),
} satisfies AgentConfiguration;
