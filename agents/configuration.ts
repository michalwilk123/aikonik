import type { ToolSet } from "ai";
import type { z } from "zod";
import type { AgentArtifact, AgentSource } from "@/agents/types";
import type { HistoryMessage } from "@/domain/chat/types";
import type { innovationVideoSchema } from "@/domain/innovation-video";
import type { ObservatoryVisualization } from "@/domain/observatory";
import type { SupportOffer } from "@/domain/support-offer";
import type { InnovationLoader } from "@/infrastructure/innovations/store";

export type AgentModelAnswer = {
  message: string;
  areaLabel?: string;
  offers?: SupportOffer[];
  sourceIds?: string[];
  artifact?: AgentArtifact | null;
};

export type AgentToolContext = {
  loadInnovations?: InnovationLoader;
  onSources: (sources: AgentSource[]) => void;
  onVisualization: (visualization: ObservatoryVisualization) => void;
};

export type AgentConfiguration = {
  prompt: string;
  sources: AgentSource[];
  outputSchema: z.ZodType<AgentModelAnswer>;
  supportsArtifacts: boolean;
  createTools: (context: AgentToolContext) => ToolSet;
  prepareHistory: (history: HistoryMessage[]) => HistoryMessage[];
  resolveHistorySources?: (
    ids: string[],
    load?: InnovationLoader,
  ) => Promise<AgentSource[]>;
  getVideos?: (
    sources: AgentSource[],
    load?: InnovationLoader,
  ) => Promise<z.infer<typeof innovationVideoSchema>[]>;
};
