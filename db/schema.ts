import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const promptVersions = sqliteTable("prompt_versions", {
  id: text().primaryKey(),
  instructions: text().notNull(),
  createdAt: integer("created_at").notNull(),
});
export const conversations = sqliteTable("conversations", {
  id: text().primaryKey(),
  agentId: text("agent_id").notNull().default("support"),
  capabilityHash: text("capability_hash").notNull(),
  createdAt: integer("created_at").notNull(),
  browser: text({ mode: "json" }).notNull(),
});
export const turns = sqliteTable(
  "turns",
  {
    id: text().primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    ordinal: integer().notNull(),
    status: text().notNull(),
    startedAt: integer("started_at").notNull(),
    finishedAt: integer("finished_at"),
    firstTextMs: integer("first_text_ms"),
    durationMs: integer("duration_ms"),
    errorCode: text("error_code"),
    errorType: text("error_type"),
    errorStatus: integer("error_status"),
    promptVersion: text("prompt_version")
      .notNull()
      .references(() => promptVersions.id),
  },
  (t) => [
    uniqueIndex("turn_order").on(t.conversationId, t.ordinal),
    uniqueIndex("one_active_turn")
      .on(t.conversationId)
      .where(sql`${t.status} = 'running'`),
    check(
      "turn_status",
      sql`${t.status} IN ('running', 'complete', 'error', 'interrupted')`,
    ),
  ],
);
export const messages = sqliteTable(
  "messages",
  {
    id: text().primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    turnId: text("turn_id")
      .notNull()
      .references(() => turns.id),
    sequence: integer().notNull(),
    role: text().notNull(),
    content: text().notNull(),
    answer: text({ mode: "json" }),
    status: text().notNull(),
  },
  (t) => [
    uniqueIndex("message_order").on(t.conversationId, t.sequence),
    uniqueIndex("one_message_per_role_per_turn").on(t.turnId, t.role),
    check("message_role", sql`${t.role} IN ('user', 'assistant')`),
  ],
);
export const modelCalls = sqliteTable(
  "model_calls",
  {
    id: text().primaryKey(),
    turnId: text("turn_id")
      .notNull()
      .references(() => turns.id),
    step: integer().notNull(),
    model: text().notNull(),
    provider: text(),
    firstTokenMs: integer("first_token_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    durationMs: integer("duration_ms").notNull(),
    finishReason: text("finish_reason").notNull(),
    contextIds: text("context_ids", { mode: "json" }).notNull(),
  },
  (t) => [uniqueIndex("model_step").on(t.turnId, t.step)],
);
export const toolCalls = sqliteTable("tool_calls", {
  id: text().primaryKey(),
  turnId: text("turn_id")
    .notNull()
    .references(() => turns.id),
  name: text().notNull(),
  durationMs: integer("duration_ms"),
  status: text().notNull().default("complete"),
  input: text({ mode: "json" }).notNull(),
  output: text({ mode: "json" }),
});
