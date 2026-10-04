import { z } from "zod";

export const requestMessageSchema = z
  .object({ id: z.uuid(), body: z.string().trim().min(1).max(12000) })
  .strict();
export type RequestMessage = {
  id: string;
  author: "customer" | "staff";
  body: string;
  createdAt: string;
  authorName: string;
  internal?: boolean;
};
export type RequestThread = {
  id: string;
  subject: string;
  submittedAt: string;
  status: string;
  message: string | null;
  artifact: unknown;
  messages: RequestMessage[];
};
export type RequestNotification = {
  id: string;
  messageId: string | null;
  kind: "receipt" | "reply" | "recovery";
  status: "pending" | "failed" | "disabled" | "sent";
  createdAt: string;
  sentAt: string | null;
  attempts: number;
  lastError: string | null;
};
