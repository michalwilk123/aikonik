"use client";

import {
  Check,
  Compass,
  FlaskConical,
  Lightbulb,
  Workflow,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { agentIds, agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";

const icons = {
  odkrywaj: Compass,
  "dodaj-pomysl": Lightbulb,
  "testuj-innowacje": FlaskConical,
  "wdrazanie-innowacji": Workflow,
};

type Pill = { left: number; width: number; ready: boolean };

export function AgentTopBar({
  activeAgent,
  onSwitch,
}: {
  activeAgent: AgentId;
  onSwitch: (id: AgentId) => void;
}) {
  const buttons = useRef(new Map<AgentId, HTMLButtonElement>());
  const [pill, setPill] = useState<Pill>({ left: 0, width: 0, ready: false });
  const active = agents[activeAgent];

  useLayoutEffect(() => {
    const button = buttons.current.get(activeAgent);
    if (!button) return;
    const measure = () =>
      setPill((current) => ({
        left: button.offsetLeft,
        width: button.offsetWidth,
        // Skip the slide on first paint; animate every switch after that.
        ready: current.width > 0,
      }));
    measure();
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, [activeAgent]);

  return (
    <nav
      aria-label="Wybierz agenta"
      className="sticky top-16 z-20 border-b border-outline-variant bg-background/95 py-3 backdrop-blur px-4 sm:px-6"
    >
      <div className="relative mx-auto flex max-w-[calc(48rem-2rem)] sm:max-w-[calc(48rem-3rem)] gap-1 overflow-x-auto">
        <span
          aria-hidden="true"
          className="agent-pill"
          data-ready={pill.ready || undefined}
          style={{
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
            backgroundColor: active.tint,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${active.color} 18%, transparent), 0 1px 2px color-mix(in srgb, ${active.color} 14%, transparent)`,
            opacity: pill.width ? 1 : 0,
          }}
        />
        {agentIds.map((id) => {
          const agent = agents[id];
          const isActive = id === activeAgent;
          const Icon = icons[id];
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
              className="relative z-10 flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-500 hover:text-foreground sm:flex-1 sm:justify-center"
              style={{ color: isActive ? agent.color : "#5B6075" }}
            >
              <Icon
                className="size-4 transition-transform duration-500 ease-out"
                style={{ transform: isActive ? "scale(1.1)" : undefined }}
                aria-hidden="true"
              />
              <span>{agent.label}</span>
              <Check
                className="agent-check size-3.5"
                data-on={isActive || undefined}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
