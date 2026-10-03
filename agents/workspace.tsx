"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgentComposer } from "@/agents/composer";
import {
  agentHref,
  agentIdFromSlug,
  agents,
  defaultAgentId,
} from "@/agents/registry";
import { StreamedMessage } from "@/agents/streamed-message";
import { AgentSubmissionForm } from "@/agents/submission-form";
import { manualDraft } from "@/agents/submission-template";
import { AgentTopBar } from "@/agents/top-bar";
import {
  type AgentId,
  type AgentMessage,
  type AgentReply,
  agentReplySchema,
} from "@/agents/types";
import { AgentWelcome } from "@/agents/welcome";
import { MODEL_ID } from "@/domain/chat/model";
import { readChatEvents } from "@/infrastructure/chat/transport";

type Session = {
  messages: AgentMessage[];
  replies: AgentReply[];
  draft: string;
  pending: boolean;
  error: string | null;
  revealing: string[];
  submission: {
    // Null for a form filled in by hand before the first reply.
    requestId: string | null;
    status: "open" | "cancelled" | "submitted";
    manual?: boolean;
  } | null;
};
const emptySession = (): Session => ({
  messages: [],
  replies: [],
  draft: "",
  pending: false,
  error: null,
  revealing: [],
  submission: null,
});

export function AgentWorkspace({ devMode = false }: { devMode?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeAgent =
    agentIdFromSlug(pathname.split("/")[2] ?? "") ?? defaultAgentId;
  const [sessions, setSessions] = useState<Record<AgentId, Session>>({
    odkrywaj: emptySession(),
    wiedza: emptySession(),
    "dodaj-pomysl": emptySession(),
    "testuj-innowacje": emptySession(),
    "wdrazanie-innowacji": emptySession(),
  });
  const requests = useRef(new Map<AgentId, AbortController>());
  const identities = useRef(
    new Map<AgentId, { conversationId: string; capability: string }>(),
  );
  const [follow, setFollow] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const session = sessions[activeAgent];
  const agent = agents[activeAgent];
  const chatDisabled = session.submission?.status === "open";
  const lastReply = session.replies.at(-1);
  const canFillManually =
    (activeAgent === "dodaj-pomysl" || activeAgent === "testuj-innowacje") &&
    !chatDisabled &&
    !session.pending &&
    session.submission?.status !== "submitted" &&
    (session.messages.length === 0 ||
      (!session.error &&
        lastReply !== undefined &&
        lastReply.message.id === session.messages.at(-1)?.id));

  useEffect(() => {
    const active = requests.current;
    return () => {
      for (const request of active.values()) request.abort();
    };
  }, []);
  useEffect(() => {
    const onScroll = () =>
      setFollow(
        document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY <
          240,
      );
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!session.messages.length || !follow) return;
    const transcript = endRef.current?.parentElement;
    if (!transcript) return;
    const observer = new ResizeObserver(() =>
      endRef.current?.scrollIntoView({ block: "end", behavior: "instant" }),
    );
    observer.observe(transcript);
    endRef.current?.scrollIntoView({ block: "end", behavior: "instant" });
    return () => observer.disconnect();
  }, [follow, session.messages.length]);
  const onRevealed = useCallback((id: string) => {
    setSessions((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(next) as AgentId[]) {
        if (next[key].revealing.includes(id))
          next[key] = {
            ...next[key],
            revealing: next[key].revealing.filter((entry) => entry !== id),
          };
      }
      return next;
    });
  }, []);

  function update(id: AgentId, change: (current: Session) => Session) {
    setSessions((previous) => ({ ...previous, [id]: change(previous[id]) }));
  }

  async function submit(text = session.draft) {
    const agentId = activeAgent;
    const content = text.trim();
    if (!content || requests.current.has(agentId) || chatDisabled) return;
    const controller = new AbortController();
    requests.current.set(agentId, controller);
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      agentId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const requestId = crypto.randomUUID();
    const assistant: AgentMessage = {
      id: requestId,
      agentId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    const identity = identities.current.get(agentId) ?? {
      conversationId: crypto.randomUUID(),
      capability: crypto.randomUUID(),
    };
    identities.current.set(agentId, identity);
    const deadline = AbortSignal.timeout(45000);
    const signal = AbortSignal.any([controller.signal, deadline]);
    setFollow(true);
    update(agentId, (current) => ({
      ...current,
      messages: [...current.messages, message, assistant],
      revealing: [...current.revealing, assistant.id],
      draft: "",
      pending: true,
      error: null,
    }));
    try {
      const body = JSON.stringify({
        ...identity,
        agentId,
        requestId,
        text: content,
        browser: {
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          viewport: { width: window.innerWidth, height: window.innerHeight },
        },
      });
      let response: Response;
      // After "stop" the server may still be finalizing the previous turn;
      // it answers 409 with retry, so resend the same request briefly.
      for (let attempt = 0; ; attempt++) {
        response = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body,
        });
        if (response.ok) break;
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          retry?: boolean;
        };
        if (!data.retry || attempt >= 5)
          throw new Error(data.error ?? "Nie udało się uzyskać odpowiedzi.");
        await new Promise((resolve) => setTimeout(resolve, 600));
        signal.throwIfAborted();
      }
      if (!response.body) throw new Error("Brak strumienia odpowiedzi.");
      for await (const event of readChatEvents(response.body, signal)) {
        if (event.type === "start" && event.requestId !== requestId)
          throw new Error("Odpowiedź nie pasuje do tej rozmowy.");
        if (event.type === "text")
          update(agentId, (current) => ({
            ...current,
            messages: current.messages.map((entry) =>
              entry.id === assistant.id
                ? { ...entry, content: event.text }
                : entry,
            ),
          }));
        if (event.type === "complete") {
          const reply = agentReplySchema.parse({
            requestId,
            message: { ...assistant, content: event.answer.message },
            sources: event.answer.sources ?? [],
            artifact: event.answer.artifact ?? null,
            visualizations: event.answer.visualizations ?? [],
            videos: event.answer.videos ?? [],
            model: devMode ? "dev-fixture" : MODEL_ID,
          });
          update(agentId, (current) => ({
            ...current,
            messages: current.messages.map((entry) =>
              entry.id === assistant.id ? reply.message : entry,
            ),
            replies: [...current.replies, reply],
            submission:
              (agentId === "dodaj-pomysl" || agentId === "testuj-innowacje") &&
              reply.artifact?.ready === true &&
              reply.artifact.fields.length > 0
                ? { requestId: reply.requestId, status: "open" }
                : null,
            pending: false,
          }));
        }
        if (event.type === "error")
          update(agentId, (current) => ({
            ...current,
            error: event.message,
            pending: false,
          }));
      }
    } catch (error) {
      update(agentId, (current) => ({
        ...current,
        error: controller.signal.aborted
          ? "Odpowiedź została zatrzymana."
          : deadline.aborted
            ? "Odpowiedź trwała zbyt długo. Spróbuj ponownie."
            : error instanceof Error
              ? error.message
              : "Nie udało się uzyskać odpowiedzi.",
      }));
    } finally {
      requests.current.delete(agentId);
      update(agentId, (current) => ({ ...current, pending: false }));
    }
  }

  return (
    <>
      <AgentTopBar
        activeAgent={activeAgent}
        onSwitch={(id) => {
          if (id !== activeAgent) router.push(agentHref(id), { scroll: false });
          setFollow(true);
        }}
      />
      <div className="mx-auto w-full max-w-5xl flex-1 bg-white px-4 pb-64 shadow-soft sm:border-x sm:border-outline-variant sm:px-8">
        {devMode && (
          <aside className="my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold">DEV — podgląd bez modelu AI</p>
            <p className="mt-1">
              Odpowiedzi są przykładowe. Zgłoszenia zapisują się w lokalnej
              bazie.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(activeAgent === "odkrywaj"
                ? ["Pokaż film innowacji"]
                : activeAgent === "wiedza"
                  ? [
                      "Pokaż mapę",
                      "Pokaż wykres",
                      "Pokaż raport i wizualizacje",
                    ]
                  : activeAgent === "dodaj-pomysl"
                    ? ["Pokaż szkic i formularz"]
                    : activeAgent === "testuj-innowacje"
                      ? ["Pokaż plan pilotażu"]
                      : ["Pokaż innowację i plan usługi"]
              ).map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={session.pending || chatDisabled}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 disabled:opacity-50"
                  onClick={() => void submit(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          </aside>
        )}
        {session.messages.length === 0 ? (
          !chatDisabled && (
            <AgentWelcome
              key={activeAgent}
              agentId={activeAgent}
              onPick={(text) => {
                void submit(text);
                inputRef.current?.focus();
              }}
            />
          )
        ) : (
          <div className="flex flex-col gap-7 py-7">
            {session.messages.map((message) => {
              const reply = session.replies.find(
                (entry) => entry.message.id === message.id,
              );
              if (message.role === "assistant")
                return (
                  <div key={message.id} className="flex flex-col gap-4">
                    <StreamedMessage
                      message={message}
                      reply={reply}
                      pending={
                        session.pending &&
                        session.messages.at(-1)?.id === message.id
                      }
                      animate={session.revealing.includes(message.id)}
                      onRevealed={onRevealed}
                    />
                  </div>
                );
              return (
                <article
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "max-w-[90%] self-end rounded-2xl bg-white px-5 py-4 shadow-soft"
                      : "w-full"
                  }
                >
                  <p
                    className="mb-2 text-xs font-semibold"
                    style={{ color: agent.color }}
                  >
                    Ty
                  </p>
                  <p className="whitespace-pre-wrap text-[16px] leading-7 text-foreground">
                    {message.content}
                  </p>
                </article>
              );
            })}
            {session.error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p>{session.error}</p>
                <button
                  type="button"
                  onClick={() =>
                    update(activeAgent, (current) => {
                      // Drop the failed exchange; resending adds it again.
                      const last = current.messages.findLastIndex(
                        (message) => message.role === "user",
                      );
                      return {
                        ...current,
                        messages:
                          last < 0
                            ? current.messages
                            : current.messages.slice(0, last),
                        draft: current.messages[last]?.content ?? "",
                        error: null,
                      };
                    })
                  }
                  className="mt-2 underline underline-offset-4"
                >
                  Przygotuj wiadomość ponownie
                </button>
              </div>
            )}
          </div>
        )}
        {canFillManually && (
          <div
            className={
              session.messages.length === 0
                ? "-mt-4 flex justify-center pb-8"
                : "flex justify-end"
            }
          >
            <button
              type="button"
              onClick={() =>
                update(activeAgent, (current) => ({
                  ...current,
                  submission: {
                    requestId: lastReply?.requestId ?? null,
                    status: "open",
                    manual: true,
                  },
                }))
              }
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
            >
              Wypełnij ręcznie
            </button>
          </div>
        )}
        {(["dodaj-pomysl", "testuj-innowacje"] as const).map((id) => {
          const entry = sessions[id];
          const submission = entry.submission;
          const reply = entry.replies.find(
            (reply) => reply.requestId === submission?.requestId,
          );
          const identity = identities.current.get(id) ?? null;
          if (
            !submission ||
            submission.status === "cancelled" ||
            (submission.requestId &&
              (!reply ||
                !identity ||
                entry.revealing.includes(reply.message.id))) ||
            (!submission.manual && !reply?.artifact) ||
            entry.pending ||
            entry.error
          )
            return null;
          return (
            <div key={id} hidden={activeAgent !== id}>
              <AgentSubmissionForm
                key={`${submission.requestId}-${submission.manual ? "manual" : "draft"}`}
                source={id}
                requestId={submission.requestId}
                artifact={manualDraft(id, reply?.artifact)}
                identity={submission.requestId ? identity : null}
                onCancel={() => {
                  update(id, (current) => ({
                    ...current,
                    submission: {
                      requestId: submission.requestId,
                      status: "cancelled",
                    },
                  }));
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                onSubmitted={() =>
                  update(id, (current) => ({
                    ...current,
                    submission: {
                      requestId: submission.requestId,
                      status: "submitted",
                    },
                  }))
                }
              />
            </div>
          );
        })}
        <div ref={endRef} className="scroll-mb-48" />
      </div>
      <AgentComposer
        agentId={activeAgent}
        value={session.draft}
        onChange={(draft) =>
          update(activeAgent, (current) => ({ ...current, draft }))
        }
        onSubmit={submit}
        onStop={() => requests.current.get(activeAgent)?.abort()}
        pending={session.pending}
        disabled={chatDisabled}
        inputRef={inputRef}
      />
    </>
  );
}
