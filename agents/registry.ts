import type { AgentId } from "@/agents/types";

export const agents = {
  odkrywaj: {
    label: "Odkrywaj",
    color: "#1B2340",
    tint: "#E9ECF5",
    step: "01",
    title: "Od potrzeby do możliwości.",
    description:
      "Opisz problem, a asystent poszuka pasujących rozwiązań w Bibliotece Innowacji Społecznych ROPS. Możesz też pytać o dokumentację projektów i dane społeczne.",
    placeholder: "Jaki problem chcesz rozwiązać lub lepiej zrozumieć?",
    examples: [
      "Co raporty ROPS mówią o starzeniu się Małopolski?",
      "Starsza osoba czuje się samotna. Jakie innowacje mogą pomóc?",
      "Jakie są luki w usługach opiekuńczych?",
    ],
  },
  "dodaj-pomysl": {
    label: "Dodaj pomysł",
    color: "#C62832",
    tint: "#FBE3E1",
    step: "02",
    title: "Twój pomysł ma dobry początek.",
    description:
      "Opowiedz o swojej idei. Asystent zada kolejne pytania i pomoże ułożyć roboczą Canvę Innowacji Społecznej.",
    placeholder: "Opowiedz o swoim pomyśle lub odpowiedz na pytanie…",
    examples: [
      "Chcę stworzyć sieć sąsiedzkiej pomocy seniorom.",
      "Mam pomysł na warsztaty cyfrowe dla osób starszych.",
      "Pomóż mi uporządkować pomysł na dostępną usługę społeczną.",
    ],
  },
  "testuj-innowacje": {
    label: "Testuj innowacje",
    color: "#7A4B00",
    tint: "#FFF1CC",
    step: "03",
    title: "Mały test. Ważna zmiana.",
    description:
      "Zaplanuj pierwszy pilotaż, ustal co chcesz sprawdzić i zbierz opinie uczestników. Znajdź kolejne usprawnienie swojego rozwiązania.",
    placeholder: "Co chcesz przetestować i z kim?",
    examples: [
      "Jak przetestować telefoniczną pomoc sąsiedzką?",
      "Chcę przygotować plan pilotażu warsztatów cyfrowych.",
      "Uczestnicy nie wracają na zajęcia. Jak zebrać ich opinie?",
    ],
  },
  "wdrazanie-innowacji": {
    label: "Wdrażanie innowacji",
    color: "#2F6B4F",
    tint: "#E4F2E9",
    step: "04",
    title: "Sprawdzone rozwiązanie. Nowe miejsce.",
    description:
      "Middleman Innowacji pomoże dopasować rozwiązanie do Twojej instytucji: odbiorców, zasobów, partnerów i sposobu świadczenia usługi.",
    placeholder: "Jaką innowację chcesz wdrożyć w swojej instytucji?",
    examples: [
      "Chcemy uruchomić pomoc sąsiedzką w naszym CUS.",
      "Jak dostosować warsztaty cyfrowe do małej gminy?",
      "Pomóż określić zasoby i partnerów potrzebnych do wdrożenia.",
    ],
  },
} satisfies Record<
  AgentId,
  {
    label: string;
    color: string;
    tint: string;
    step: string;
    title: string;
    description: string;
    placeholder: string;
    examples: string[];
  }
>;
export const agentIds = Object.keys(agents) as AgentId[];
export const defaultAgentId: AgentId = "odkrywaj";
