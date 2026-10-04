"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RequestThread = {
  id: string;
  subject: string;
  submittedAt: string;
  status: string;
  message: string | null;
  artifact: {
    title: string;
    fields: { label: string; value: string }[];
  } | null;
  messages: {
    id: string;
    author: "customer" | "staff";
    authorName?: string;
    body: string;
    createdAt: string;
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
});
function Timestamp({ value }: { value: string }) {
  return (
    <time dateTime={value} className="text-xs text-on-surface-variant">
      {dateFormatter.format(new Date(value))}
    </time>
  );
}

export function ConversationMessages({ thread }: { thread: RequestThread }) {
  return (
    <ol aria-label="Wiadomości w rozmowie" className="flex flex-col gap-4">
      <li className="max-w-[95%] self-end rounded-2xl bg-secondary-container p-4">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">Ty</span>
          <Timestamp value={thread.submittedAt} />
        </div>
        <h2 className="font-semibold">{thread.subject}</h2>
        {thread.message && (
          <p className="mt-2 whitespace-pre-wrap break-words">
            {thread.message}
          </p>
        )}
        {thread.artifact && (
          <dl className="mt-3 flex flex-col gap-3">
            {thread.artifact.fields.map((field) => (
              <div key={field.label}>
                <dt className="font-semibold">{field.label}</dt>
                <dd className="whitespace-pre-wrap break-words">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </li>
      {thread.messages.map((message) => (
        <li
          key={message.id}
          className={`max-w-[95%] rounded-2xl p-4 ${message.author === "customer" ? "self-end bg-secondary-container" : "self-start border border-outline-variant bg-white"}`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold">
              {message.author === "customer"
                ? "Ty"
                : message.authorName || "Pracownik ROPS"}
            </span>
            <Timestamp value={message.createdAt} />
          </div>
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function RequestConversation({ id }: { id: string }) {
  const [thread, setThread] = useState<RequestThread | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const sending = useRef(false);
  const threadVersion = useRef(0);
  const retry = useRef<{ id: string; body: string } | null>(null);
  const endpoint = `/api/requests/${encodeURIComponent(id)}`;

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const version = ++threadVersion.current;
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal });
        if (signal?.aborted || version !== threadVersion.current) return;
        if (response.status === 401 || response.status === 403) {
          setThread(null);
          return;
        }
        const result = (await response.json()) as {
          thread: RequestThread;
          error?: string;
          message?: string;
        };
        if (signal?.aborted || version !== threadVersion.current) return;
        if (!response.ok)
          throw new Error(result.error ?? "Nie udało się odświeżyć rozmowy.");
        setThread(result.thread);
      } catch (error) {
        if (!signal?.aborted && version === threadVersion.current)
          setError(
            error instanceof Error
              ? error.message
              : "Nie udało się odświeżyć rozmowy.",
          );
      } finally {
        if (!signal?.aborted && version === threadVersion.current)
          setChecked(true);
      }
    },
    [endpoint],
  );

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (fragment) {
      const value = fragment.startsWith("token=")
        ? new URLSearchParams(fragment).get("token")
        : fragment;
      if (value) setToken(value);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      setChecked(true);
      return;
    }
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const authenticated = Boolean(thread);
  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    const poll = () => {
      if (!sending.current && document.visibilityState === "visible")
        void refresh(controller.signal);
    };
    const timer = window.setInterval(poll, 15_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
      controller.abort();
    };
  }, [authenticated, refresh]);

  async function openConversation() {
    if (!token || sending.current) return;
    sending.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as {
        thread: RequestThread;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        if ([401, 403, 410].includes(response.status)) setToken(null);
        throw new Error(
          result.error ??
            "Link wygasł lub został już użyty. Poproś o nowy link poniżej.",
        );
      }
      setToken(null);
      await refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się otworzyć rozmowy.",
      );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending.current || !body.trim()) return;
    ++threadVersion.current;
    sending.current = true;
    setPending(true);
    setError(null);
    const message = body.trim();
    if (!retry.current || retry.current.body !== message)
      retry.current = { id: crypto.randomUUID(), body: message };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retry.current),
      });
      const result = (await response.json()) as {
        thread: RequestThread;
        error?: string;
        message?: string;
      };
      if (response.status === 401 || response.status === 403) setThread(null);
      if (!response.ok)
        throw new Error(
          result.error ?? "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
        );
      setThread(result.thread);
      setBody("");
      retry.current = null;
      setNotice("Wiadomość została wysłana.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać wiadomości.",
      );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  async function recover(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`${endpoint}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        thread: RequestThread;
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(
          result.error ?? "Nie udało się wysłać linku. Spróbuj ponownie.",
        );
      setNotice(
        result.message ??
          "Jeśli adres pasuje do zgłoszenia, wyślemy na niego nowy prywatny link.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Nie udało się wysłać linku.",
      );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className={thread ? "sr-only" : "text-sm text-green-900"}
        >
          {notice}
        </p>
      )}
      {!checked && <p role="status">Sprawdzanie dostępu do rozmowy…</p>}
      {token && !thread && (
        <section className="rounded-2xl border border-outline-variant bg-white p-5">
          <Button
            className="h-11 px-5"
            disabled={pending}
            onClick={openConversation}
          >
            {pending ? "Otwieranie…" : "Otwórz rozmowę"}
          </Button>
        </section>
      )}
      {thread ? (
        <>
          <ConversationMessages thread={thread} />
          <form onSubmit={send} className="flex flex-col gap-3">
            <Label className="sr-only" htmlFor="reply-body">
              Twoja odpowiedź
            </Label>
            <Textarea
              id="reply-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={pending}
              required
              maxLength={10000}
              rows={3}
              placeholder="Napisz odpowiedź…"
            />
            <Button
              type="submit"
              className="h-11 self-start px-5"
              disabled={pending || !body.trim()}
            >
              {pending ? "Wysyłanie…" : "Wyślij odpowiedź"}
            </Button>
          </form>
        </>
      ) : (
        checked &&
        !token && (
          <section className="rounded-2xl border border-outline-variant bg-white p-5">
            <h2 className="text-xl font-bold">Wyślij nowy link do rozmowy</h2>
            <form onSubmit={recover} className="mt-4 flex flex-col gap-3">
              <Label htmlFor="recovery-email">Adres e-mail ze zgłoszenia</Label>
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={pending}
              />
              <Button
                type="submit"
                disabled={pending}
                className="h-11 self-start px-5"
              >
                {pending ? "Wysyłanie…" : "Wyślij prywatny link"}
              </Button>
            </form>
          </section>
        )
      )}
    </div>
  );
}
