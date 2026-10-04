"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { formatSubmissionDate } from "@/infrastructure/cms/workflow";

type Message = {
  id: string;
  body: string;
  author: string;
  authorName?: string;
  createdAt: string;
  internal?: boolean;
};
type Notification = { id: string; status: string; messageId?: string | null };
type Thread = {
  message?: string | null;
  artifact?: {
    title: string;
    fields: { label: string; value: string }[];
  } | null;
  submittedAt?: string;
  messages: Message[];
  notifications?: Notification[];
};

export function SubmissionChat() {
  const { id } = useDocumentInfo();
  const prefix = useId();
  const [thread, setThread] = useState<Thread>();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{
    id: string;
    body: string;
    internal: boolean;
  } | null>(null);
  const endpoint = `/api/cms/submissions/${encodeURIComponent(String(id))}/chat`;
  const load = useCallback(async () => {
    if (!id) return;
    const response = await fetch(endpoint, { cache: "no-store" });
    const data = (await response.json()) as Thread & { error?: string };
    if (!response.ok)
      throw new Error(data.error || "Nie udało się wczytać rozmowy.");
    setThread(data);
  }, [endpoint, id]);
  useEffect(() => {
    const refresh = () => load().catch((reason) => setError(reason.message));
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function send() {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError("");
    if (
      !pending.current ||
      pending.current.body !== body.trim() ||
      pending.current.internal !== internal
    )
      pending.current = {
        id: crypto.randomUUID(),
        body: body.trim(),
        internal,
      };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending.current),
      });
      const data = (await response.json()) as Thread & { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Nie udało się wysłać wiadomości.");
      setThread(data);
      setBody("");
      pending.current = null;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Nie udało się wysłać wiadomości.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function retry(notificationId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const data = (await response.json()) as Thread & { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Nie udało się ponowić powiadomienia.");
      setThread(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Nie udało się ponowić powiadomienia.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!id) return null;
  return (
    <section className="staff-chat" aria-labelledby={`${prefix}-heading`}>
      <h2 id={`${prefix}-heading`}>Rozmowa z klientem</h2>
      {!thread && !error && <p role="status">Wczytywanie rozmowy…</p>}
      <ol className="staff-chat-messages" aria-label="Historia rozmowy">
        {(thread?.message || thread?.artifact) && (
          <li className="staff-chat-message">
            <div className="staff-chat-message-heading">
              <strong>Klient — zgłoszenie</strong>
              {thread.submittedAt && (
                <time dateTime={thread.submittedAt}>
                  {formatSubmissionDate(thread.submittedAt)}
                </time>
              )}
            </div>
            {thread?.message && <p>{thread.message}</p>}
            {thread?.artifact && (
              <>
                <strong>{thread.artifact.title}</strong>
                {thread.artifact.fields.map((field) => (
                  <p key={field.label}>
                    <strong>{field.label}</strong>
                    <br />
                    {field.value}
                  </p>
                ))}
              </>
            )}
          </li>
        )}
        {thread?.messages.map((message) => (
          <li
            key={message.id}
            className={`staff-chat-message${message.internal ? " staff-chat-message--internal" : ""}`}
          >
            <div className="staff-chat-message-heading">
              <strong>
                {message.internal
                  ? "Notatka wewnętrzna"
                  : message.author === "customer"
                    ? "Klient"
                    : message.authorName || "Obsługa"}
              </strong>
              <time dateTime={message.createdAt}>
                {formatSubmissionDate(message.createdAt)}
              </time>
            </div>
            <p>{message.body}</p>
          </li>
        ))}
      </ol>
      {thread?.notifications?.map(
        (notification) =>
          (notification.status === "failed" ||
            notification.status === "pending") && (
            <div className="staff-chat-delivery" key={notification.id}>
              <span>
                {notification.status === "failed"
                  ? "Powiadomienie e-mail nie zostało wysłane."
                  : "Powiadomienie e-mail nie zostało jeszcze wysłane."}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => retry(notification.id)}
              >
                Ponów powiadomienie
              </button>
            </div>
          ),
      )}
      <label htmlFor={`${prefix}-body`}>
        {internal ? "Notatka dla zespołu" : "Odpowiedź do klienta"}
      </label>
      <textarea
        id={`${prefix}-body`}
        rows={5}
        maxLength={10000}
        value={body}
        disabled={busy}
        onChange={(event) => setBody(event.target.value)}
      />
      <label className="staff-chat-internal">
        <input
          type="checkbox"
          checked={internal}
          disabled={busy}
          onChange={(event) => setInternal(event.target.checked)}
        />{" "}
        Notatka wewnętrzna
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={busy || !body.trim()} onClick={send}>
        {busy ? "Zapisywanie…" : internal ? "Dodaj notatkę" : "Wyślij"}
      </button>
    </section>
  );
}
