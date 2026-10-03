import { Building2, Route } from "lucide-react";

type Props = {
  artifact?: { title: string; fields: { label: string; value: string }[] };
};

export function AgentPanel({ artifact }: Props) {
  return (
    <section className="space-y-5" aria-label="Warsztat wdrażania innowacji">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <Building2 className="mb-3 size-5 text-rose-700" aria-hidden="true" />
        <h2 className="font-semibold text-rose-950">
          {artifact?.title ?? "Z innowacji do lokalnej usługi"}
        </h2>
        {artifact ? (
          <dl className="mt-4 space-y-4">
            {artifact.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800">
                  {field.label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Middleman Innowacji pomoże dopasować rozwiązanie do Twojej
            instytucji: odbiorców, zespołu, zasobów i sposobu świadczenia
            usługi.
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <Route className="mb-3 size-5 text-rose-700" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-stone-900">
          Pierwszy krok: mały pilotaż
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Określ właściciela usługi, lokalne zmiany i warunki próby. Przed
          rozszerzeniem wdrożenia zbierz feedback odbiorców.
        </p>
        <a
          className="mt-3 inline-block text-xs font-medium text-rose-800 underline underline-offset-4"
          href="https://rops.krakow.pl/innowacje-spoleczne/regiostars-awards-2025/pl-inkubator-wlaczenia-spolecznego,poznaj-innowacje-spoleczne"
          target="_blank"
          rel="noreferrer"
        >
          ROPS · innowacje w usługach społecznych
        </a>
      </div>
    </section>
  );
}
