"use client";

import { ArrowDown, Download, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgentComposer } from "@/agents/composer";
import { AgentPanel as CanvasPanel } from "@/agents/dodaj-pomysl/components";
import { AgentPanel as DiscoveryPanel } from "@/agents/odkrywaj/components";
import { agents, defaultAgentId } from "@/agents/registry";
import { StreamedMessage } from "@/agents/streamed-message";
import { AgentSubmissionForm } from "@/agents/submission-form";
import { AgentPanel as TestingPanel } from "@/agents/testuj-innowacje/components";
import { AgentTopBar } from "@/agents/top-bar";
import {
  type AgentId,
  type AgentMessage,
  type AgentReply,
  agentReplySchema,
} from "@/agents/types";
import { AgentPanel as RolloutPanel } from "@/agents/wdrazanie-innowacji/components";
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
};
const emptySession = (): Session => ({
  messages: [],
  replies: [],
  draft: "",
  pending: false,
  error: null,
  revealing: [],
});
const panels = {
  odkrywaj: DiscoveryPanel,
  "dodaj-pomysl": CanvasPanel,
  "testuj-innowacje": TestingPanel,
  "wdrazanie-innowacji": RolloutPanel,
};

export function AgentWorkspace() {
  const [activeAgent, setActiveAgent] = useState<AgentId>(defaultAgentId);
  const [sessions, setSessions] = useState<Record<AgentId, Session>>({
    odkrywaj: emptySession(),
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
  const submissionIdentity = identities.current.get(activeAgent);
  const Panel = panels[activeAgent];
  const artifactReply = session.replies.findLast(
    (reply) => reply.artifact !== null,
  );

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

  async function submit() {
    const agentId = activeAgent;
    const content = session.draft.trim();
    if (!content || requests.current.has(agentId)) return;
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
            model: MODEL_ID,
          });
          update(agentId, (current) => ({
            ...current,
            messages: current.messages.map((entry) =>
              entry.id === assistant.id ? reply.message : entry,
            ),
            replies: [...current.replies, reply],
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

  function exportConversation() {
    const file = new Blob(
      [
        JSON.stringify(
          {
            agentId: activeAgent,
            agentLabel: agent.label,
            messages: session.messages,
            replies: session.replies,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hubmi-${activeAgent}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AgentTopBar
        activeAgent={activeAgent}
        onSwitch={(id) => {
          setActiveAgent(id);
          setFollow(true);
        }}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-8 pt-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: agent.color }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <span>{agent.label}</span>
              <span className="text-xs font-normal text-slate-400">
                / {agent.step}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={session.pending}
                onClick={() => {
                  identities.current.delete(activeAgent);
                  update(activeAgent, emptySession);
                  inputRef.current?.focus();
                }}
                className="flex min-h-10 items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-40"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Nowa rozmowa
              </button>
              <button
                type="button"
                disabled={!session.messages.length || session.pending}
                onClick={exportConversation}
                className="flex min-h-10 items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-40"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Pobierz rozmowę
              </button>
            </div>
          </div>
          {session.messages.length === 0 ? (
            <AgentWelcome
              agentId={activeAgent}
              onPick={(draft) => {
                update(activeAgent, (current) => ({ ...current, draft }));
                inputRef.current?.focus();
              }}
            />
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
                      {reply?.artifact &&
                        reply.artifact.fields.length > 0 &&
                        !session.pending &&
                        !session.error &&
                        !session.revealing.includes(message.id) &&
                        session.messages.at(-1)?.id === message.id &&
                        (activeAgent === "dodaj-pomysl" ||
                          activeAgent === "testuj-innowacje") &&
                        submissionIdentity && (
                          <AgentSubmissionForm
                            key={reply.requestId}
                            source={activeAgent}
                            requestId={reply.requestId}
                            artifact={reply.artifact}
                            identity={submissionIdentity}
                          />
                        )}
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
                      {message.role === "user" ? "Ty" : "Asystent"} ·{" "}
                      {agents[message.agentId].label}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
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
              <div ref={endRef} className="scroll-mb-48" />
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-36 lg:self-start" key={activeAgent}>
          <Panel artifact={artifactReply?.artifact ?? undefined} />
          {artifactReply && (
            <p className="mt-4 text-xs text-slate-500">
              Szkic · {agent.label} · na podstawie tej rozmowy
            </p>
          )}
        </aside>
      </div>
      {!follow && session.messages.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setFollow(true);
            endRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }}
          className="fixed right-6 bottom-48 z-20 flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm shadow-dock"
        >
          <ArrowDown className="size-4" aria-hidden="true" />
          Najnowsza wiadomość
        </button>
      )}
      <AgentComposer
        agentId={activeAgent}
        value={session.draft}
        onChange={(draft) =>
          update(activeAgent, (current) => ({ ...current, draft }))
        }
        onSubmit={submit}
        onStop={() => requests.current.get(activeAgent)?.abort()}
        pending={session.pending}
        inputRef={inputRef}
      />
    </>
  );
}
