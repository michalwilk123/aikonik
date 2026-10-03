import type { AgentId } from "@/agents/types";

export const agents = {
  odkrywaj: {
    label: "Dopasuj",
    color: "#1B2340",
    tint: "#E9ECF5",
    step: "01",
    title: "Od potrzeby do możliwości.",
    description:
      "Opowiedz, z czym potrzebujesz pomocy. Asystent dopyta o Twoją sytuację i dobierze pasujące projekty, wraz z dokumentacją i filmami.",
    placeholder: "Z czym potrzebujesz pomocy?",
    examples: [
      "Opiekuję się bliską osobą i potrzebuję wsparcia. Od czego zacząć?",
      "Starsza osoba czuje się samotna. Jakie innowacje mogą pomóc?",
      "Szukam projektu, który pomoże osobom z niepełnosprawnością żyć samodzielnie.",
    ],
  },
  wiedza: {
    label: "Wiedza",
    color: "#245B85",
    tint: "#E5F1FA",
    step: "02",
    title: "Pytaj. Porównuj. Zobacz dane.",
    description:
      "Odkrywaj fakty i ciekawostki o Małopolsce. Asystent wyszuka dane statystyczne i raporty społeczne, porówna obszary oraz pokaże wyniki na wykresach i mapach.",
    placeholder: "Jakie dane lub ciekawostki chcesz poznać?",
    examples: [
      "Pokaż na mapie, w których powiatach Małopolski najwięcej osób korzysta z pomocy społecznej.",
      "Porównaj dzietność w Małopolsce i Polsce na wykresie.",
      "Co wiemy o starzeniu się Małopolski?",
    ],
  },
  "dodaj-pomysl": {
    label: "Dodaj pomysł",
    color: "#C62832",
    tint: "#FBE3E1",
    step: "03",
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
    step: "04",
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
    step: "05",
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
