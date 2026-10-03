import { ArrowUpRight, Check, FilePenLine } from "lucide-react";
import { canvasSource, canvasSteps } from "@/agents/dodaj-pomysl/canvas";

export function AgentPanel({
  artifact,
}: {
  artifact?: { title: string; fields: { label: string; value: string }[] };
}) {
  const fields = artifact?.fields.filter((field) => field.value.trim()) ?? [];
  const filledSteps = canvasSteps.filter((step) =>
    fields.some((field) => field.label === step.label),
  ).length;

  return (
    <section
      className="space-y-5"
      aria-label="Social Canvas agenta Dodaj pomysł"
    >
      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
        <div className="mb-3 flex items-center gap-2 text-violet-700">
          <FilePenLine size={18} aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Dodaj pomysł · Twój warsztat
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          {artifact?.title ?? "Mój Social Canvas"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Rozmawiaj o swoim pomyśle. Tutaj będziemy zbierać Twoje odpowiedzi,
          krok po kroku.
        </p>
        <div className="mt-4 flex justify-between text-xs text-slate-600">
          <span>Obszary roboczego szkicu</span>
          <span>
            {filledSteps}/{canvasSteps.length}
          </span>
        </div>
        <progress
          className="mt-2 h-1.5 w-full accent-violet-600"
          value={filledSteps}
          max={canvasSteps.length}
          aria-label="Liczba opisanych obszarów canvasu"
        />
      </div>

      <div className="space-y-3">
        {fields.length ? (
          fields.map((field) => (
            <div
              key={field.label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <Check
                  size={14}
                  className="text-violet-600"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-slate-800">
                  {field.label}
                </h3>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {field.value}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-violet-200 p-5 text-sm leading-relaxed text-slate-500">
            Zacznij od kilku słów o pomyśle. Nie musisz znać budżetu ani mieć
            gotowego rozwiązania.
          </div>
        )}
      </div>

      <a
        href={canvasSource.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-xs text-violet-700 underline-offset-4 hover:underline"
      >
        Otwórz arkusz Social Canvas (PDF)
        <ArrowUpRight size={13} aria-hidden="true" />
      </a>
      <p className="text-xs leading-relaxed text-slate-500">
        Roboczy szkic, bez wysyłania do ROPS. Licznik pokazuje opisane obszary,
        a nie potwierdzenie kompletności wniosku.
      </p>
    </section>
  );
}
