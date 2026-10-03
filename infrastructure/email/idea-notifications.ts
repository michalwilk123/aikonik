import { Resend } from "resend";
import type { SubmissionInput } from "@/infrastructure/cms/submissions";

export type NotificationConfig = {
  apiKey?: string;
  from?: string;
  siteURL: string;
  production: boolean;
};
export type SendNotification = (
  message: {
    from: string;
    to: string;
    subject: string;
    text: string;
  },
  idempotencyKey: string,
) => Promise<void>;

export function emailDeliveryEnabled(config: NotificationConfig) {
  const host = new URL(config.siteURL).hostname;
  return Boolean(
    config.production &&
      config.apiKey &&
      config.from &&
      host !== "localhost" &&
      !host.endsWith(".localhost") &&
      host !== "[::1]" &&
      !/^127\./.test(host) &&
      host !== "0.0.0.0",
  );
}

export async function notifyNewIdea(
  db: D1Database,
  input: SubmissionInput,
  config: NotificationConfig,
  send?: SendNotification,
) {
  if (input.source !== "dodaj-pomysl" || !emailDeliveryEnabled(config)) return;
  const recipients = await db
    .prepare(`
    SELECT id, notification_email AS email FROM users
    WHERE role IN ('admin', 'cms') AND email_notifications = 1
      AND notification_email IS NOT NULL AND trim(notification_email) <> ''
  `)
    .all<{ id: number; email: string }>();
  const resend = new Resend(config.apiKey);
  const deliver: SendNotification =
    send ??
    (async (message, idempotencyKey) => {
      const { error } = await resend.emails.send(message, { idempotencyKey });
      if (error) throw new Error(`Resend: ${error.name}`);
    });
  const link = new URL(
    `/admin/collections/submissions/${encodeURIComponent(input.id)}`,
    config.siteURL,
  ).href;
  // Separate messages keep staff notification addresses private.
  for (const recipient of recipients.results) {
    try {
      await deliver(
        {
          from: config.from ?? "",
          to: recipient.email.trim(),
          subject: "AIkonik — nowy pomysł mieszkańca",
          text: `W Hubie zgłoszono nowy pomysł: ${input.subject}\n\nZobacz zgłoszenie w panelu pracownika:\n${link}\n\nUstawienia powiadomień możesz zmienić w panelu: Moje ustawienia.`,
        },
        `idea/${input.id}/user/${recipient.id}`,
      );
    } catch {
      // biome-ignore lint/suspicious/noConsole: Worker logs record delivery failures without addresses or submission contents.
      console.error("Idea notification delivery failed", {
        submissionId: input.id,
        userId: recipient.id,
      });
    }
  }
}
