"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { agentIds, agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";

type Pill = {
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
};

export function AgentTopBar({
  activeAgent,
  onSwitch,
}: {
  activeAgent: AgentId;
  onSwitch: (id: AgentId) => void;
}) {
  const buttons = useRef(new Map<AgentId, HTMLButtonElement>());
  const [pill, setPill] = useState<Pill>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });
  const active = agents[activeAgent];

  useLayoutEffect(() => {
    const button = buttons.current.get(activeAgent);
    if (!button) return;
    const measure = () =>
      setPill((current) => ({
        left: button.offsetLeft,
        top: button.offsetTop,
        width: button.offsetWidth,
        height: button.offsetHeight,
        // Skip the slide on first paint; animate every switch after that.
        ready: current.width > 0,
      }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, [activeAgent]);

  return (
    <nav
      aria-label="Wybierz agenta"
      className="sticky top-16 z-20 border-b border-outline-variant bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
    >
      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-1 sm:grid-cols-5">
        <span
          aria-hidden="true"
          className="agent-pill"
          data-ready={pill.ready || undefined}
          style={{
            width: pill.width,
            height: pill.height,
            bottom: "auto",
            transform: `translate(${pill.left}px, ${pill.top}px)`,
            backgroundColor: active.tint,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${active.color} 18%, transparent), 0 1px 2px color-mix(in srgb, ${active.color} 14%, transparent)`,
            opacity: pill.width ? 1 : 0,
          }}
        />
        {agentIds.map((id) => {
          const agent = agents[id];
          const isActive = id === activeAgent;
          return (
            <button
              key={id}
              ref={(node) => {
                if (node) buttons.current.set(id, node);
                else buttons.current.delete(id);
              }}
              type="button"
              onClick={() => onSwitch(id)}
              aria-pressed={isActive}
              className="relative z-10 flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg px-4 py-3 text-base leading-tight font-semibold transition-colors duration-500 hover:text-foreground"
              style={{ color: isActive ? agent.color : "#5B6075" }}
            >
              <span className="min-w-0 break-words">{agent.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
