import { BookOpen, ExternalLink } from "lucide-react";
import { knowledgeScope } from "@/agents/odkrywaj/knowledge";

export function AgentPanel({
  artifact: _artifact,
}: {
  artifact?: { title: string; fields: { label: string; value: string }[] };
}) {
  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5"
      aria-label="Źródła agenta Odkrywaj"
    >
      <div className="mb-3 flex items-center gap-2 text-emerald-800">
        <BookOpen className="size-4" aria-hidden="true" />
        <h2 className="font-semibold text-sm">Wiedza z raportów ROPS</h2>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        Zacznij od potrzeb ludzi. Odkrywaj pomaga zrozumieć dane i znaleźć
        kierunek dla Twojego pomysłu.
      </p>
      <a
        className="mt-4 flex items-start gap-2 text-sm font-medium text-emerald-800 underline-offset-4 hover:underline"
        href="https://rops.krakow.pl/pliki-do-pobrania/wpis,2025-uslugi-spoleczne-w-malopolsce-deficyty-potrzeby-potencjal-rozwojowy-zaktualizowane-wnioski-z-diagnozy,1348"
        target="_blank"
        rel="noreferrer"
      >
        <span>Usługi społeczne w Małopolsce — diagnoza ROPS, 2025</span>
        <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      </a>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {knowledgeScope}
      </p>
      <a
        className="mt-4 inline-block text-xs font-medium text-emerald-800 underline underline-offset-4"
        href="https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan"
        target="_blank"
        rel="noreferrer"
      >
        Zobacz cały katalog raportów
      </a>
    </section>
  );
}
