import { ArrowUpRight } from "lucide-react";
import { agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";

export function AgentWelcome({
  agentId,
  onPick,
}: {
  agentId: AgentId;
  onPick: (text: string) => void;
}) {
  const agent = agents[agentId];
  return (
    <section className="agent-swap flex w-full flex-col gap-7 pt-6 pb-8 sm:pt-8 sm:pb-14">
      <div className="space-y-4">
        <h1
          className="text-3xl leading-tight font-black tracking-tight sm:text-5xl"
          style={{ color: agent.color }}
        >
          {agent.title}
        </h1>
        <p className="text-base leading-7 text-on-surface-variant">
          {agent.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {agent.examples.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="flex items-center gap-3 rounded-2xl border p-4 text-left text-sm text-foreground transition-shadow hover:shadow-sm"
            style={{
              backgroundColor: agent.tint,
              borderColor: `color-mix(in srgb, ${agent.color} 25%, transparent)`,
            }}
          >
            {text}
            <ArrowUpRight
              className="size-4 shrink-0"
              style={{ color: agent.color }}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
