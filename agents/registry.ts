import type { AgentId } from "@/agents/types";

export const agents = {
  odkrywaj: {
    label: "Odkrywaj",
    color: "#0f766e",
    tint: "#f0fdfa",
    step: "01",
    title: "Od potrzeby do możliwości.",
    description:
      "Poznaj wyzwania Małopolski i szukaj kierunków rozwiązań w wiedzy ROPS. Zacznij od problemu, który chcesz lepiej zrozumieć.",
    badge: "Wiedza ROPS · tylko odczyt",
    placeholder: "Jaki problem społeczny chcesz poznać?",
    examples: [
      "Co raporty ROPS mówią o starzeniu się Małopolski?",
      "Jak rozwijać pomoc sąsiedzką dla seniorów?",
      "Jakie są luki w usługach opiekuńczych?",
    ],
  },
  "dodaj-pomysl": {
    label: "Dodaj pomysł",
    color: "#7e22ce",
    tint: "#faf5ff",
    step: "02",
    title: "Twój pomysł ma dobry początek.",
    description:
      "Opowiedz o swojej idei. Asystent zada kolejne pytania i pomoże ułożyć roboczą Canvę Innowacji Społecznej.",
    badge: "Wywiad · Social Canvas",
    placeholder: "Opowiedz o swoim pomyśle lub odpowiedz na pytanie…",
    examples: [
      "Chcę stworzyć sieć sąsiedzkiej pomocy seniorom.",
      "Mam pomysł na warsztaty cyfrowe dla osób starszych.",
      "Pomóż mi uporządkować pomysł na dostępną usługę społeczną.",
    ],
  },
  "testuj-innowacje": {
    label: "Testuj innowacje",
    color: "#92400e",
    tint: "#fffbeb",
    step: "03",
    title: "Mały test. Ważna zmiana.",
    description:
      "Zaplanuj pierwszy pilotaż, ustal co chcesz sprawdzić i zbierz opinie uczestników. Znajdź kolejne usprawnienie swojego rozwiązania.",
    badge: "Pilotaż · opinie · usprawnienia",
    placeholder: "Co chcesz przetestować i z kim?",
    examples: [
      "Jak przetestować telefoniczną pomoc sąsiedzką?",
      "Chcę przygotować plan pilotażu warsztatów cyfrowych.",
      "Uczestnicy nie wracają na zajęcia. Jak zebrać ich opinie?",
    ],
  },
  "wdrazanie-innowacji": {
    label: "Wdrażanie innowacji",
    color: "#be123c",
    tint: "#fff1f2",
    step: "04",
    title: "Sprawdzone rozwiązanie. Nowe miejsce.",
    description:
      "Middleman Innowacji pomoże dopasować rozwiązanie do Twojej instytucji: odbiorców, zasobów, partnerów i sposobu świadczenia usługi.",
    badge: "Middleman Innowacji · adaptacja usługi",
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
    badge: string;
    placeholder: string;
    examples: string[];
  }
>;
export const agentIds = Object.keys(agents) as AgentId[];
export const defaultAgentId: AgentId = "odkrywaj";
