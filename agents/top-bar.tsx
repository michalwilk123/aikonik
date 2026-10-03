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
    // On narrow screens the track scrolls; keep the selected agent in view.
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, [activeAgent]);

  return (
    <nav
      aria-label="Wybierz agenta"
      className="sticky top-16 z-20 border-b border-outline-variant bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
    >
      <div
        className="agent-track relative mx-auto flex w-full max-w-5xl gap-0.5 overflow-x-auto rounded-2xl p-1.5"
        style={{
          backgroundColor: `color-mix(in srgb, ${active.tint} 45%, var(--color-surface-container))`,
        }}
      >
        <span
          aria-hidden="true"
          className="agent-pill"
          data-ready={pill.ready || undefined}
          style={{
            width: pill.width,
            height: pill.height,
            transform: `translate(${pill.left}px, ${pill.top}px)`,
            boxShadow: `0 0 0 1px color-mix(in srgb, ${active.color} 14%, transparent), 0 1px 2px color-mix(in srgb, ${active.color} 12%, transparent), 0 4px 12px -4px color-mix(in srgb, ${active.color} 22%, transparent)`,
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
              className="agent-tab relative z-10 flex min-h-11 shrink-0 items-center justify-center rounded-md px-4 text-[15px] leading-tight font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-1 sm:flex-1 sm:px-5"
              style={{
                color: isActive ? agent.color : "#4F546A",
                outlineColor: agent.color,
              }}
            >
              {agent.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
