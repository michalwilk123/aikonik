import { submissionTemplates } from "@/agents/submission-template";
import { type AgentArtifact, artifactSchema } from "@/agents/types";
import { ChatConflict } from "@/domain/chat/types";
import type { SubmissionInput } from "@/domain/submissions/input";

type AgentSubmission = Exclude<SubmissionInput, { source: "contact" }>;

// A form filled in before any reply has no conversation and uses the template.
export async function verifyAgentSubmission(
  db: D1Database,
  input: AgentSubmission,
) {
  const draft =
    input.conversationId && input.capability && input.requestId
      ? await latestDraft(db, {
          source: input.source,
          conversationId: input.conversationId,
          capability: input.capability,
          requestId: input.requestId,
        })
      : null;
  // The form lists every template field plus fields the assistant added, and
  // each of them must be filled in.
  const template = submissionTemplates[input.source];
  const allowed = new Set([
    ...template.labels,
    ...(draft?.fields.map((field) => field.label) ?? []),
  ]);
  const fields = input.artifact.fields;
  const labels = fields.map((field) => field.label);
  if (
    input.artifact.title !== (draft?.title ?? template.title) ||
    new Set(labels).size !== labels.length ||
    labels.some((label) => !allowed.has(label)) ||
    fields.some((field) => !field.value.trim()) ||
    template.labels.some((label) => !labels.includes(label))
  )
    throw new ChatConflict(
      409,
      "Szkic nie odpowiada zapisanej wersji. Przejrzyj najnowszą odpowiedź.",
    );
  return { ...draft, title: input.artifact.title, fields };
}

async function latestDraft(
  db: D1Database,
  input: {
    source: AgentSubmission["source"];
    conversationId: string;
    capability: string;
    requestId: string;
  },
): Promise<AgentArtifact | null> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input.capability),
  );
  const hash = Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const conversation = await db
    .prepare("SELECT capability_hash, agent_id FROM conversations WHERE id = ?")
    .bind(input.conversationId)
    .first<{ capability_hash: string; agent_id: string }>();
  if (
    !conversation ||
    conversation.capability_hash !== hash ||
    conversation.agent_id !== input.source
  )
    throw new ChatConflict(403, "Brak dostępu do tego szkicu.");
  // Once saved, the same immutable revision can be retried even after a new turn.
  // The storage helper compares the full fingerprint before returning its receipt.
  const saved = await db
    .prepare("SELECT id FROM submissions WHERE source_turn_id = ?")
    .bind(input.requestId)
    .first<{ id: string }>();
  const latest = await db
    .prepare(`SELECT t.id, t.status, m.answer FROM turns t
    LEFT JOIN messages m ON m.turn_id = t.id AND m.role = 'assistant'
    WHERE t.conversation_id = ? AND (? IS NULL OR t.id = ?) ORDER BY t.ordinal DESC LIMIT 1`)
    .bind(input.conversationId, saved?.id ?? null, input.requestId)
    .first<{ id: string; status: string; answer: string | null }>();
  if (
    latest?.id !== input.requestId ||
    latest.status !== "complete" ||
    !latest.answer
  )
    throw new ChatConflict(
      409,
      "Szkic zmienił się. Przejrzyj najnowszą odpowiedź i wyślij ponownie.",
    );
  const draft = artifactSchema
    .nullish()
    .safeParse(JSON.parse(latest.answer).artifact);
  if (!draft.success)
    throw new ChatConflict(
      409,
      "Szkic nie odpowiada zapisanej wersji. Przejrzyj najnowszą odpowiedź.",
    );
  return draft.data ?? null;
}
