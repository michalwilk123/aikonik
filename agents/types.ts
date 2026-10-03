import { z } from "zod";
import { innovationVideoSchema } from "@/domain/innovation-video";
import { observatoryVisualizationSchema } from "@/domain/observatory";

export const agentIdSchema = z.enum([
  "odkrywaj",
  "wiedza",
  "dodaj-pomysl",
  "testuj-innowacje",
  "wdrazanie-innowacji",
]);
export type AgentId = z.infer<typeof agentIdSchema>;

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url(),
  excerpt: z.string(),
  page: z.number().optional(),
});
export type AgentSource = z.infer<typeof sourceSchema>;
export const artifactSchema = z.object({
  title: z.string().min(1).max(200),
  fields: z
    .array(
      z.object({
        label: z.string().min(1).max(150),
        value: z.string().min(1).max(2000),
      }),
    )
    .max(24),
});
export type AgentArtifact = z.infer<typeof artifactSchema>;

const agentMessageSchema = z.object({
  id: z.uuid(),
  agentId: agentIdSchema,
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(12000),
  createdAt: z.iso.datetime(),
});
export type AgentMessage = z.infer<typeof agentMessageSchema>;
export const agentRequestSchema = z
  .object({
    agentId: agentIdSchema,
    requestId: z.uuid(),
    messages: z.array(agentMessageSchema).min(1).max(24),
    previousArtifact: artifactSchema.nullish(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.messages.some((message) => message.agentId !== input.agentId)) {
      ctx.addIssue({
        code: "custom",
        message: "Conversation belongs to a different agent",
      });
    }
    if (input.messages.at(-1)?.role !== "user") {
      ctx.addIssue({
        code: "custom",
        message: "Last message must be from the user",
      });
    }
    if (
      input.messages.reduce(
        (size, message) => size + message.content.length,
        0,
      ) > 32000
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Conversation exceeds context budget",
      });
    }
  });
export type AgentRequest = z.infer<typeof agentRequestSchema>;
export const agentOutputSchema = z.object({
  message: z.string().min(1).max(12000),
  sourceIds: z.array(z.string()).max(8),
  artifact: artifactSchema.nullable(),
});
export const readOnlyAgentOutputSchema = agentOutputSchema.omit({
  artifact: true,
});

export const agentReplySchema = z.object({
  requestId: z.uuid(),
  message: agentMessageSchema,
  sources: z.array(sourceSchema),
  artifact: artifactSchema.nullable(),
  visualizations: z.array(observatoryVisualizationSchema).max(4).optional(),
  videos: z.array(innovationVideoSchema).max(3).optional(),
  model: z.string(),
});
export type AgentReply = z.infer<typeof agentReplySchema>;
