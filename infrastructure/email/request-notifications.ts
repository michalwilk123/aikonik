import { Resend } from "resend";
import {
  emailDeliveryEnabled,
  type NotificationConfig,
  type SendNotification,
} from "@/infrastructure/email/idea-notifications";
import { hash, linkToken } from "@/infrastructure/requests/security";

export type RequestNotificationConfig = NotificationConfig & {
  secret: string;
  dev?: boolean;
};
export async function ensureCustomerNotification(
  db: D1Database,
  submissionId: string,
  kind: "receipt" | "reply" | "recovery",
  config: RequestNotificationConfig,
  messageId?: string,
) {
  const id =
    kind === "receipt"
      ? `receipt:${submissionId}`
      : kind === "reply"
        ? `reply:${messageId}`
        : crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO request_notifications(id,submission_id,message_id,kind,status,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING",
    )
    .bind(
      id,
      submissionId,
      messageId ?? null,
      kind,
      emailDeliveryEnabled(config) ? "pending" : "disabled",
      await hash(await linkToken(config.secret, id)),
      new Date(Date.now() + 7 * 86400000).toISOString(),
      now,
    )
    .run();
  return id;
}
export async function notificationURL(
  config: RequestNotificationConfig,
  id: string,
  submissionId: string,
) {
  return new URL(
    `/zgloszenia/${encodeURIComponent(submissionId)}#${await linkToken(config.secret, id)}`,
    config.siteURL,
  ).href;
}
export async function deliverCustomerNotification(
  db: D1Database,
  id: string,
  config: RequestNotificationConfig,
  send?: SendNotification,
) {
  if (!emailDeliveryEnabled(config)) return "disabled" as const;
  const now = new Date().toISOString();
  const row = await db
    .prepare(
      "UPDATE request_notifications SET status='pending',attempts=attempts+1,lease_until=? WHERE id=? AND status IN ('pending','failed','disabled') AND (lease_until IS NULL OR lease_until<?) AND consumed_at IS NULL AND expires_at>? RETURNING submission_id,kind",
    )
    .bind(new Date(Date.now() + 60000).toISOString(), id, now, now)
    .first<{ submission_id: string; kind: string }>();
  if (!row)
    return (
      (
        await db
          .prepare("SELECT status FROM request_notifications WHERE id=?")
          .bind(id)
          .first<{ status: string }>()
      )?.status ?? "pending"
    );
  const submission = await db
    .prepare("SELECT email FROM submissions WHERE id=?")
    .bind(row.submission_id)
    .first<{ email: string }>();
  try {
    if (!submission) throw new Error("Missing submission");
    const resend = new Resend(config.apiKey);
    const deliver =
      send ??
      (async (message, key) => {
        const { error } = await resend.emails.send(message, {
          idempotencyKey: key,
        });
        if (error) throw new Error("Email provider rejected delivery");
      });
    await deliver(
      {
        from: config.from ?? "",
        to: submission.email,
        subject:
          row.kind === "reply"
            ? "AIkonik — nowa odpowiedź na zgłoszenie"
            : "AIkonik — prywatny link do zgłoszenia",
        text: `${row.kind === "reply" ? "Pracownik odpowiedział na Twoje zgłoszenie." : "Twoje zgłoszenie jest dostępne pod prywatnym linkiem."}\n\nPrzeczytaj rozmowę i odpowiedz:\n${await notificationURL(config, id, row.submission_id)}\n\nLink jest ważny przez 7 dni i działa jednorazowo. Po otwarciu rozmowa pozostaje dostępna na tym urządzeniu przez 7 dni. Nie udostępniaj linku innym osobom. Po wygaśnięciu możesz poprosić o nowy link na stronie rozmowy. Odpowiedz przez stronę rozmowy — odpowiedzi na ten e-mail nie trafiają do zgłoszenia.`,
      },
      `request/${id}`,
    );
    await db
      .prepare(
        "UPDATE request_notifications SET status='sent',sent_at=?,last_error=NULL,lease_until=NULL WHERE id=?",
      )
      .bind(new Date().toISOString(), id)
      .run();
    return "sent" as const;
  } catch {
    await db
      .prepare(
        "UPDATE request_notifications SET status='failed',last_error='Nie udało się wysłać wiadomości e-mail.',lease_until=NULL WHERE id=?",
      )
      .bind(id)
      .run();
    return "failed" as const;
  }
}
