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
    <section className="flex flex-col gap-7 py-6 sm:py-10">
      <span
        className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
        style={{ color: agent.color, backgroundColor: agent.tint }}
      >
        {agent.badge}
      </span>
      <div className="space-y-4">
        <h1 className="max-w-xl text-3xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {agent.title}
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600">
          {agent.description}
        </p>
      </div>
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Zacznij rozmowę
        </h2>
        {agent.examples.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 transition-shadow hover:shadow-sm"
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
      <p className="text-xs leading-5 text-slate-500">
        Każdy etap ma własnego asystenta i osobną rozmowę. Możesz przełączać
        etapy w górnym pasku.
      </p>
    </section>
  );
}
