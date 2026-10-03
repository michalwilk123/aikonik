import { ArrowUpRight } from "lucide-react";
import { canvasSource } from "@/agents/dodaj-pomysl/canvas";
import { knowledgeScope } from "@/agents/odkrywaj/knowledge";
import { agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";

const guidance = {
  odkrywaj: {
    text: knowledgeScope,
    link: "https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan",
    linkLabel: "Zobacz raporty ROPS",
  },
  "dodaj-pomysl": {
    text: "Krok po kroku zbierzemy Twoje odpowiedzi w roboczy Social Canvas. Zacznij od kilku słów o pomyśle — nie musisz znać budżetu ani mieć gotowego rozwiązania.",
    link: canvasSource.url,
    linkLabel: "Otwórz arkusz Social Canvas (PDF)",
  },
  "testuj-innowacje": {
    text: "Wybierz jedną rzecz do sprawdzenia, zaproś odbiorców i przygotuj prosty prototyp. Opisz, co zadziałało i co przeszkadzało, a następnie popraw rozwiązanie i przetestuj je ponownie.",
    link: "https://www.nesta.org.uk/toolkit/prototype-testing-plan/",
    linkLabel: "Metoda: Nesta · plan testowania",
  },
  "wdrazanie-innowacji": {
    text: "Określ właściciela usługi, potrzebne zasoby, partnerów i lokalne zmiany. Zacznij od małego pilotażu i zbierz opinie odbiorców przed rozszerzeniem wdrożenia.",
    link: "https://rops.krakow.pl/innowacje-spoleczne/regiostars-awards-2025/pl-inkubator-wlaczenia-spolecznego,poznaj-innowacje-spoleczne",
    linkLabel: "ROPS · innowacje w usługach społecznych",
  },
};

export function AgentWelcome({
  agentId,
  onPick,
}: {
  agentId: AgentId;
  onPick: (text: string) => void;
}) {
  const agent = agents[agentId];
  const info = guidance[agentId];
  return (
    <section className="agent-swap flex flex-col gap-7 py-6 sm:py-10">
      <span
        className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
        style={{ color: agent.color, backgroundColor: agent.tint }}
      >
        {agent.badge}
      </span>
      <div className="space-y-4">
        <h1 className="max-w-xl text-3xl leading-tight font-black tracking-tight text-foreground sm:text-5xl">
          {agent.title}
        </h1>
        <p className="max-w-xl text-base leading-7 text-on-surface-variant">
          {agent.description}
        </p>
        <p className="text-sm leading-6 text-on-surface-variant">{info.text}</p>
        <a
          href={info.link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm underline underline-offset-4"
          style={{ color: agent.color }}
        >
          {info.linkLabel}
        </a>
      </div>
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
          Zacznij rozmowę
        </h2>
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
      <p className="text-xs leading-5 text-on-surface-variant">
        Każdy etap ma własnego asystenta i osobną rozmowę. Możesz przełączać
        etapy w górnym pasku.
      </p>
    </section>
  );
}
