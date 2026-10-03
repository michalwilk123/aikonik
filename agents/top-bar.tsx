import {
  Check,
  Compass,
  FlaskConical,
  Lightbulb,
  Workflow,
} from "lucide-react";
import { agentIds, agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";

const icons = {
  odkrywaj: Compass,
  "dodaj-pomysl": Lightbulb,
  "testuj-innowacje": FlaskConical,
  "wdrazanie-innowacji": Workflow,
};
export function AgentTopBar({
  activeAgent,
  onSwitch,
}: {
  activeAgent: AgentId;
  onSwitch: (id: AgentId) => void;
}) {
  return (
    <nav
      aria-label="Wybierz agenta"
      className="sticky top-16 z-20 border-b border-slate-200 bg-background/95 py-3 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">
        {agentIds.map((id) => {
          const agent = agents[id];
          const active = id === activeAgent;
          const Icon = icons[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSwitch(id)}
              aria-pressed={active}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:flex-1 sm:justify-center"
              style={{
                color: active ? agent.color : "#475569",
                backgroundColor: active ? agent.tint : undefined,
                boxShadow: active ? `inset 0 -2px ${agent.color}` : undefined,
              }}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{agent.label}</span>
              {active && <Check className="size-3.5" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
