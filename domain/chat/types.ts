import { z } from "zod";
import { agentIdSchema, artifactSchema, sourceSchema } from "@/agents/types";
import { supportAnswerSchema } from "@/domain/support-offer";

const chatAnswerSchema = supportAnswerSchema.extend({
  sources: z.array(sourceSchema).max(8).optional(),
  artifact: artifactSchema.nullable().optional(),
});
export type ChatAnswer = z.infer<typeof chatAnswerSchema>;

export const sendTurnSchema = z
  .object({
    conversationId: z.uuid(),
    capability: z.uuid(),
    requestId: z.uuid(),
    agentId: agentIdSchema.optional(),
    text: z.string().trim().min(1).max(4000),
    browser: z
      .object({
        language: z.string().max(100),
        timezone: z.string().max(100),
        viewport: z.object({
          width: z.number().int().min(0).max(20000),
          height: z.number().int().min(0).max(20000),
        }),
      })
      .optional(),
  })
  .strict();
export type SendTurn = z.infer<typeof sendTurnSchema>;
export type HistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), requestId: z.uuid() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("complete"), answer: chatAnswerSchema }),
  z.object({
    type: z.literal("error"),
    code: z.enum(["generation_failed", "timeout", "interrupted"]),
    message: z.string(),
  }),
]);
export type ChatEvent = z.infer<typeof chatEventSchema>;
export class ChatConflict extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // The previous turn is still finishing; the same request can be resent.
    public readonly retry = false,
  ) {
    super(message);
  }
}
