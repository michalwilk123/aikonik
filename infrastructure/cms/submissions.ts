import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AgentArtifact } from "@/agents/types";
import { ChatConflict } from "@/domain/chat/types";
import { isDevMode } from "@/infrastructure/chat/dev-mode";
import { notifyNewIdea } from "@/infrastructure/email/idea-notifications";
import {
  deliverCustomerNotification,
  ensureCustomerNotification,
  notificationURL,
} from "@/infrastructure/email/request-notifications";

export type SubmissionInput = {
  id: string;
  source: "contact" | "dodaj-pomysl" | "testuj-innowacje" | "grant-application";
  grantCallId?: number;
  callSnapshot?: unknown;
  name: string;
  email: string;
  subject: string;
  message?: string;
  artifact?: AgentArtifact;
  conversationId?: string;
  sourceTurnId?: string;
};

export async function insertSubmission(
  db: D1Database,
  input: SubmissionInput,
  onCreated?: () => void,
) {
  const canonical = JSON.stringify([
    input.source,
    input.name,
    input.email,
    input.subject,
    input.message ?? null,
    input.artifact ?? null,
    input.conversationId ?? null,
    input.sourceTurnId ?? null,
    ...(input.grantCallId
      ? [input.grantCallId, input.callSnapshot ?? null]
      : []),
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
    INSERT INTO submissions (id, submitted_at, source, name, email, subject, message, details, artifact, conversation_id, source_turn_id, fingerprint, grant_call_id, call_snapshot)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (? IS NULL OR (
      NOT EXISTS (SELECT 1 FROM turns WHERE conversation_id = ? AND status = 'running')
      AND ? = (SELECT id FROM turns WHERE conversation_id = ? ORDER BY ordinal DESC LIMIT 1)
    )) AND (? IS NULL OR EXISTS (SELECT 1 FROM grant_calls WHERE id=? AND published=1 AND julianday(opens_at)<=julianday('now') AND julianday(closes_at)>julianday('now') AND updated_at=?))
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
      input.grantCallId ?? null,
      input.callSnapshot ? JSON.stringify(input.callSnapshot) : null,
      input.sourceTurnId ?? null,
      input.conversationId ?? null,
      input.sourceTurnId ?? null,
      input.conversationId ?? null,
      input.grantCallId ?? null,
      input.grantCallId ?? null,
      input.callSnapshot
        ? ((input.callSnapshot as { updatedAt?: string }).updatedAt ?? null)
        : null,
    )
    .run();
  if (result.meta.changes) {
    onCreated?.();
    return { id: input.id };
  }
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

export async function saveSubmission(
  input: SubmissionInput,
  requestURL: string,
) {
  const { env, ctx } = getCloudflareContext();
  const receipt = await insertSubmission(env.DB, input, () => {
    const notification = notifyNewIdea(env.DB, input, {
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM_EMAIL,
      siteURL: new URL(requestURL).origin,
      production: process.env.NODE_ENV === "production",
    }).catch(() => {
      // biome-ignore lint/suspicious/noConsole: Keep notification failures separate from successful submission receipts.
      console.error("Idea notification processing failed", {
        submissionId: input.id,
      });
    });
    ctx.waitUntil(notification);
  });
  const config = {
    secret: env.PAYLOAD_SECRET,
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM_EMAIL,
    siteURL: env.SITE_URL || new URL(requestURL).origin,
    production: process.env.NODE_ENV === "production",
    dev: isDevMode(env.DEV),
  };
  const notificationId = await ensureCustomerNotification(
    env.DB,
    receipt.id,
    "receipt",
    config,
  );
  const notification = await deliverCustomerNotification(
    env.DB,
    notificationId,
    config,
  );
  return {
    ...receipt,
    conversationURL: `/zgloszenia/${receipt.id}`,
    notification,
    ...(config.dev
      ? {
          devConversationURL: await notificationURL(
            { ...config, siteURL: new URL(requestURL).origin },
            notificationId,
            receipt.id,
          ),
        }
      : {}),
  };
}
