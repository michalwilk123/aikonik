import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Opisz potrzebę",
    text: "Wpisz na dole, czego szukasz – np. opieki dla bliskiego, dowozu obiadów czy warsztatów.",
    accent: false,
  },
  {
    title: "Darmowe dopasowanie",
    text: "System bezpiecznie dobierze certyfikowane punkty wsparcia najbliżej Twojego miejsca zamieszkania.",
    accent: true,
  },
  {
    title: "Adres i telefon",
    text: "Otrzymasz bezpośredni numer telefonu, godziny otwarcia i wskazówki dojazdu do placówki.",
    accent: false,
  },
];

const examples = [
  "Szukam wolontariusza do pomocy przy zakupach dla seniorki na Krowodrzy",
  "Gdzie w Nowej Hucie znajdę bezpłatne zajęcia ruchowe i klub seniora?",
  "Potrzebuję bezpłatnego wsparcia psychologicznego dla nastolatka – Podgórze",
  "Jak zgłosić pomysł na pomoc sąsiedzką do Hubu Innowacji ROPS?",
];

export function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-10 py-10">
      <div className="flex flex-col items-start gap-4">
        <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
          Oficjalny system miejski · Regionalny Ośrodek Polityki Społecznej
        </span>
        <h1 className="text-[28px] leading-9 font-semibold text-primary">
          Dzień dobry. W czym możemy Ci dzisiaj pomóc?
        </h1>
        <p className="max-w-2xl text-lg leading-7 text-on-surface-variant">
          Krakowski asystent bezpłatnego wsparcia społecznego. Opisz swoją
          sytuację zwykłymi słowami – bez urzędowego języka. Wskażemy sprawdzone
          programy, kluby i pomoc sąsiedzką w Twojej dzielnicy.
        </p>
      </div>

      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col gap-3 rounded-xl border border-outline-variant/40 bg-white p-5 shadow-soft"
          >
            <span
              className={`flex size-10 items-center justify-center rounded-full bg-surface-container text-base font-bold ${
                step.accent ? "text-secondary" : "text-primary"
              }`}
            >
              {i + 1}
            </span>
            <h2 className="text-base font-semibold text-primary">
              {step.title}
            </h2>
            <p className="text-[13px] leading-5 text-on-surface-variant">
              {step.text}
            </p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-primary">
            Przykłady zapytań mieszkańców Krakowa
          </h2>
          <span className="hidden text-[13px] text-on-surface-variant sm:inline">
            Kliknij, aby wstawić do okna
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {examples.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onPick(text)}
              className="min-h-12 cursor-pointer rounded-xl border border-outline-variant/40 bg-white p-4 text-left text-sm text-on-surface shadow-soft transition-colors hover:border-secondary hover:bg-surface-container-low"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-xl flex-col gap-1">
          <h2 className="text-base font-semibold text-primary">
            Wolisz porozmawiać przez telefon?
          </h2>
          <p className="text-[13px] leading-5 text-on-surface-variant">
            Dyżurny pracownik ROPS Kraków odpowie na Twoje pytania od
            poniedziałku do piątku w godz. 8:00–16:00.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<a href="tel:124220636" />}
          className="h-12 shrink-0 rounded-lg px-6 text-base font-semibold"
        >
          12 422 06 36
        </Button>
      </div>
    </section>
  );
}
