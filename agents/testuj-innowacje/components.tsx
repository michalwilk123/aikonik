import { ClipboardCheck, MessageSquareText } from "lucide-react";

type Props = {
  artifact?: { title: string; fields: { label: string; value: string }[] };
};

export function AgentPanel({ artifact }: Props) {
  return (
    <section className="space-y-5" aria-label="Warsztat testowania innowacji">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <ClipboardCheck
          className="mb-3 size-5 text-amber-700"
          aria-hidden="true"
        />
        <h2 className="font-semibold text-amber-950">
          {artifact?.title ?? "Mały test, konkretna wiedza"}
        </h2>
        {artifact ? (
          <dl className="mt-4 space-y-4">
            {artifact.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  {field.label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <ol className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
            <li>1. Wybierz jedną rzecz, którą chcesz sprawdzić.</li>
            <li>2. Zaproś odbiorców i przygotuj prosty prototyp.</li>
            <li>3. Zbierz feedback, popraw i przetestuj ponownie.</li>
          </ol>
        )}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <MessageSquareText
          className="mb-3 size-5 text-amber-700"
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold text-stone-900">
          Głos uczestników
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Opisz, co zadziałało, co przeszkadzało i jaką zmianę proponujesz.
          Możesz też zadeklarować chęć udziału w teście.
        </p>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          To roboczy plan. Rozmowa nie zapisuje do oficjalnego naboru.
        </p>
        <a
          className="mt-3 inline-block text-xs font-medium text-amber-800 underline underline-offset-4"
          href="https://www.nesta.org.uk/toolkit/prototype-testing-plan/"
          target="_blank"
          rel="noreferrer"
        >
          Metoda: Nesta · plan testowania
        </a>
      </div>
    </section>
  );
}
