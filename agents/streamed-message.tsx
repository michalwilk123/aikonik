"use client";

import { useEffect } from "react";
import { agents } from "@/agents/registry";
import type { AgentMessage, AgentReply } from "@/agents/types";
import { useSmoothText } from "@/app/_hooks/use-smooth-text";

export function StreamedMessage({
  message,
  reply,
  pending,
  animate,
  onRevealed,
}: {
  message: AgentMessage;
  reply?: AgentReply;
  pending: boolean;
  animate: boolean;
  onRevealed: (id: string) => void;
}) {
  const text = useSmoothText(message.content, animate);
  const revealing = text.length < message.content.length;
  const agent = agents[message.agentId];
  useEffect(() => {
    if (animate && !pending && !revealing && message.content)
      onRevealed(message.id);
  }, [animate, pending, revealing, message.content, message.id, onRevealed]);
  return (
    <article
      className="chat-enter w-full"
      aria-label={`Odpowiedź · ${agent.label}`}
      aria-busy={pending || revealing}
    >
      <p className="mb-2 text-xs font-semibold" style={{ color: agent.color }}>
        Asystent · {agent.label}
      </p>
      {text ? (
        <p className="chat-text whitespace-pre-wrap break-words text-[16px] leading-7 text-slate-800">
          {text}
          {(pending || revealing) && (
            <span
              className="chat-cursor"
              aria-hidden="true"
              style={{ backgroundColor: agent.color }}
            />
          )}
        </p>
      ) : pending ? (
        <div
          role="status"
          className="flex items-center gap-2 text-sm"
          style={{ color: agent.color }}
        >
          <span className="chat-thinking flex gap-1" aria-hidden="true">
            {[0, 160, 320].map((delay) => (
              <span
                key={delay}
                className="size-1.5 rounded-full bg-current"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
          {agent.label} przygotowuje odpowiedź…
        </div>
      ) : null}
      {reply && !revealing && reply.sources.length > 0 && (
        <details className="chat-enter mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <summary className="cursor-pointer font-medium">
            Źródła · {reply.sources.length}
          </summary>
          <ul className="mt-3 space-y-3">
            {reply.sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-2"
                  style={{ color: agent.color }}
                >
                  {source.title}
                  {source.page ? ` · str. ${source.page}` : ""}
                </a>
                <p className="mt-1 leading-5">{source.excerpt}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {reply && !revealing && (
        <span className="sr-only" role="status">
          Odpowiedź asystenta jest gotowa.
        </span>
      )}
    </article>
  );
}
