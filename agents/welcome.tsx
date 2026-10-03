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
    <section className="agent-swap mx-auto flex max-w-xl flex-col items-center gap-7 py-8 text-center sm:py-14">
      <div className="space-y-4">
        <h1 className="text-3xl leading-tight font-black tracking-tight text-foreground sm:text-5xl">
          {agent.title}
        </h1>
        <p className="text-base leading-7 text-on-surface-variant">
          {agent.description}
        </p>
      </div>
      <div className="w-full space-y-3">
        {agent.examples.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-white p-4 text-left text-sm text-foreground transition-shadow hover:shadow-sm"
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
