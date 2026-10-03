import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AgentArtifact } from "@/agents/types";
import { ChatConflict } from "@/domain/chat/types";

export type SubmissionInput = {
  id: string;
  source: "contact" | "dodaj-pomysl" | "testuj-innowacje";
  name: string;
  email: string;
  subject: string;
  message?: string;
  artifact?: AgentArtifact;
  conversationId?: string;
  sourceTurnId?: string;
};

export async function insertSubmission(db: D1Database, input: SubmissionInput) {
  const canonical = JSON.stringify([
    input.source,
    input.name,
    input.email,
    input.subject,
    input.message ?? null,
    input.artifact ?? null,
    input.conversationId ?? null,
    input.sourceTurnId ?? null,
  ]);
  const fingerprint = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(canonical),
      ),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  const details =
    input.artifact?.fields
      .map((field) => `${field.label}\n${field.value}`)
      .join("\n\n") ?? null;
  const result = await db
    .prepare(`
    INSERT INTO submissions (id, submitted_at, source, name, email, subject, message, details, artifact, conversation_id, source_turn_id, fingerprint)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE ? IS NULL OR (
      NOT EXISTS (SELECT 1 FROM turns WHERE conversation_id = ? AND status = 'running')
      AND ? = (SELECT id FROM turns WHERE conversation_id = ? ORDER BY ordinal DESC LIMIT 1)
    )
    ON CONFLICT DO NOTHING
  `)
    .bind(
      input.id,
      new Date().toISOString(),
      input.source,
      input.name,
      input.email,
      input.subject,
      input.message ?? null,
      details,
      input.artifact ? JSON.stringify(input.artifact) : null,
      input.conversationId ?? null,
      input.sourceTurnId ?? null,
      fingerprint,
      input.sourceTurnId ?? null,
      input.conversationId ?? null,
      input.sourceTurnId ?? null,
      input.conversationId ?? null,
    )
    .run();
  if (result.meta.changes) return { id: input.id };
  const existing = await db
    .prepare(
      "SELECT id, fingerprint FROM submissions WHERE id = ? OR source_turn_id = ?",
    )
    .bind(input.id, input.sourceTurnId ?? null)
    .first<{ id: string; fingerprint: string }>();
  if (existing?.fingerprint === fingerprint) return { id: existing.id };
  throw new ChatConflict(
    409,
    existing
      ? "To zgłoszenie zostało już zapisane z inną treścią."
      : "Szkic się zmienił. Sprawdź najnowszą odpowiedź i spróbuj ponownie.",
  );
}

export async function saveSubmission(input: SubmissionInput) {
  return insertSubmission(getCloudflareContext().env.DB, input);
}
