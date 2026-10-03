import type { AgentEvent, ChatStore } from "@/application/chat/runtime";
import type { ChatAnswer } from "@/domain/chat/types";
import {
  ChatConflict,
  type HistoryMessage,
  type SendTurn,
} from "@/domain/chat/types";
import { getAgentConfiguration } from "@/infrastructure/chat/agent-config";

async function digest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function makeD1ChatStore(db: D1Database): ChatStore {
  const statement = (sql: string, ...args: unknown[]) =>
    db.prepare(sql).bind(...args);
  return {
    async accept(input: SendTurn, browser) {
      const hash = await digest(input.capability);
      const instructions = getAgentConfiguration(input.agentId).instructions;
      const prompt = await digest(instructions);
      const now = Date.now();
      await db.batch([
        statement(
          "INSERT INTO prompt_versions (id, instructions, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
          prompt,
          instructions,
          now,
        ),
        statement(
          "INSERT INTO conversations (id, agent_id, capability_hash, created_at, browser) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
          input.conversationId,
          input.agentId ?? "support",
          hash,
          now,
          JSON.stringify(browser),
        ),
      ]);
      const conversation = await statement(
        "SELECT capability_hash, agent_id FROM conversations WHERE id = ?",
        input.conversationId,
      ).first<{ capability_hash: string; agent_id: string }>();
      if (conversation?.capability_hash !== hash)
        throw new ChatConflict(403, "Brak dostępu do rozmowy.");
      if (conversation.agent_id !== (input.agentId ?? "support"))
        throw new ChatConflict(409, "Rozmowa należy do innego agenta.");
      const existing = await statement(
        `SELECT t.conversation_id, t.status, t.error_code, u.content AS query, a.content, a.answer
        FROM turns t JOIN messages u ON u.turn_id = t.id AND u.role = 'user'
        JOIN messages a ON a.turn_id = t.id AND a.role = 'assistant' WHERE t.id = ?`,
        input.requestId,
      ).first<{
        conversation_id: string;
        status: string;
        error_code: string | null;
        query: string;
        content: string;
        answer: string | null;
      }>();
      if (existing) {
        if (
          existing.conversation_id !== input.conversationId ||
          existing.query !== input.text
        )
          throw new ChatConflict(
            409,
            "Identyfikator wiadomości został już użyty.",
          );
        if (
          existing.status === "running" &&
          !(await expire(input.conversationId, now))
        )
          throw new ChatConflict(
            409,
            "Odpowiedź na tę wiadomość jest jeszcze przygotowywana.",
          );
        return {
          history: [],
          replay: {
            text: existing.content,
            answer: existing.answer
              ? (JSON.parse(existing.answer) as ChatAnswer)
              : null,
            status:
              existing.status === "running" ? "interrupted" : existing.status,
            errorCode: existing.error_code,
          },
        };
      }
      await expire(input.conversationId, now);
      try {
        // D1 batch is transactional. Unique partial index enforces one running
        // turn across tabs/requests; a competing admission rolls back entirely.
        await db.batch([
          statement(
            `INSERT INTO turns (id, conversation_id, ordinal, status, started_at, prompt_version)
            SELECT ?, ?, COALESCE(MAX(ordinal), 0) + 1, 'running', ?, ? FROM turns WHERE conversation_id = ?`,
            input.requestId,
            input.conversationId,
            now,
            prompt,
            input.conversationId,
          ),
          statement(
            `INSERT INTO messages (id, conversation_id, turn_id, sequence, role, content, status)
            SELECT ?, conversation_id, id, ordinal * 2 - 1, 'user', ?, 'complete' FROM turns WHERE id = ?`,
            `${input.requestId}:user`,
            input.text,
            input.requestId,
          ),
          statement(
            `INSERT INTO messages (id, conversation_id, turn_id, sequence, role, content, status)
            SELECT ?, conversation_id, id, ordinal * 2, 'assistant', '', 'running' FROM turns WHERE id = ?`,
            `${input.requestId}:assistant`,
            input.requestId,
          ),
        ]);
      } catch (error) {
        if (String(error).includes("UNIQUE constraint"))
          throw new ChatConflict(
            409,
            "Poczekaj na zakończenie poprzedniej odpowiedzi.",
            true,
          );
        throw error;
      }
      const rows = await statement(
        // Only finished exchanges plus the new question: partial text of failed
        // or stopped turns is not a reply, and their questions are asked again.
        `SELECT m.id, m.role, m.content, m.answer FROM messages m JOIN turns t ON t.id = m.turn_id
        WHERE m.conversation_id = ? AND (t.status = 'complete' OR (t.id = ? AND m.role = 'user'))
        ORDER BY m.sequence`,
        input.conversationId,
        input.requestId,
      ).all<{
        id: string;
        role: "user" | "assistant";
        content: string;
        answer: string | null;
      }>();
      const history: HistoryMessage[] = rows.results.map(
        ({ id, role, content, answer }) => {
          if (!answer) return { id, role, content };
          const value = JSON.parse(answer) as ChatAnswer;
          return {
            id,
            role,
            content: JSON.stringify({
              message: value.message,
              areaLabel: value.areaLabel,
              ...(value.offers.length ? { offers: value.offers } : {}),
              ...(value.sources?.length
                ? { sourceIds: value.sources.map((source) => source.id) }
                : {}),
              ...(value.artifact ? { artifact: value.artifact } : {}),
              ...(value.visualizations?.length
                ? {
                    visualizations: value.visualizations.map(
                      ({ indicatorId, kind, year, title }) => ({
                        indicatorId,
                        kind,
                        year,
                        title,
                      }),
                    ),
                  }
                : {}),
            }),
          };
        },
      );
      return { history };
    },
    async saveText(requestId, text) {
      await statement(
        "UPDATE messages SET content = ? WHERE turn_id = ? AND role = 'assistant' AND status = 'running'",
        text,
        requestId,
      ).run();
    },
    async log(
      requestId,
      event: Extract<AgentEvent, { type: "model" | "tool" }>,
      contextIds,
    ) {
      if (event.type === "model") {
        await statement(
          `INSERT INTO model_calls (id, turn_id, step, model, provider, first_token_ms, input_tokens, output_tokens, duration_ms, finish_reason, context_ids)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET provider = excluded.provider, first_token_ms = excluded.first_token_ms,
          input_tokens = excluded.input_tokens, output_tokens = excluded.output_tokens,
          duration_ms = excluded.duration_ms, finish_reason = excluded.finish_reason`,
          `${requestId}:${event.step}`,
          requestId,
          event.step,
          event.model,
          event.provider ?? null,
          event.firstTokenMs ?? null,
          event.usage.input ?? null,
          event.usage.output ?? null,
          event.durationMs,
          event.finishReason,
          JSON.stringify(contextIds),
        ).run();
      } else {
        await statement(
          "INSERT INTO tool_calls (id, turn_id, name, duration_ms, status, input, output) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET duration_ms = excluded.duration_ms, status = excluded.status, output = excluded.output",
          `${requestId}:${event.id}`,
          requestId,
          event.name,
          event.durationMs ?? null,
          event.status ?? "complete",
          JSON.stringify(event.input ?? null),
          JSON.stringify(event.output),
        ).run();
      }
    },
    async finish(requestId, result) {
      await db.batch([
        statement(
          "UPDATE model_calls SET finish_reason = ?, duration_ms = ? WHERE turn_id = ? AND finish_reason = 'running'",
          result.status === "interrupted"
            ? "aborted"
            : result.status === "error"
              ? "error"
              : "stop",
          result.durationMs,
          requestId,
        ),
        statement(
          "UPDATE messages SET content = ?, answer = ?, status = ? WHERE turn_id = ? AND role = 'assistant' AND status = 'running'",
          result.text,
          result.answer ? JSON.stringify(result.answer) : null,
          result.status,
          requestId,
        ),
        statement(
          `UPDATE turns SET status = ?, finished_at = ?, first_text_ms = ?, duration_ms = ?, error_code = ?, error_type = ?, error_status = ? WHERE id = ? AND status = 'running'`,
          result.status,
          Date.now(),
          result.firstTextMs,
          result.durationMs,
          result.errorCode,
          result.errorType ?? null,
          result.errorStatus ?? null,
          requestId,
        ),
      ]);
    },
  };

  async function expire(conversationId: string, now: number) {
    const results = await db.batch([
      statement(
        `UPDATE messages SET status = 'interrupted' WHERE role = 'assistant' AND status = 'running'
        AND turn_id IN (SELECT id FROM turns WHERE conversation_id = ? AND status = 'running' AND started_at < ?)`,
        conversationId,
        now - 45000,
      ),
      statement(
        `UPDATE turns SET status = 'interrupted', error_code = 'interrupted', finished_at = ?, duration_ms = ? - started_at
        WHERE conversation_id = ? AND status = 'running' AND started_at < ?`,
        now,
        now,
        conversationId,
        now - 45000,
      ),
    ]);
    return results[1].meta.changes > 0;
  }
}
