import type { AgentId } from "@/agents/types";
import type { ChatAgent } from "@/application/chat/runtime";
import type { ChatAnswer } from "@/domain/chat/types";
import type { ObservatoryVisualization } from "@/domain/observatory";
import { getAgentConfiguration } from "@/infrastructure/chat/agent-config";
import { readReport } from "@/infrastructure/chat/report-tool";
import {
  readInnovation,
  readSocialChallenges,
} from "@/infrastructure/innovations/search";
import {
  innovations,
  socialChallenges,
} from "@/infrastructure/innovations/source";
import { COUNTY_PATHS } from "@/infrastructure/observatory/geometry";

function sampleVisualization(kind: "map" | "bar"): ObservatoryVisualization {
  return {
    kind,
    indicatorId: 25,
    title: "DEV — przykładowe dane do podglądu (fikcyjne)",
    year: 2024,
    unit: "%",
    sourceUrl: "https://obserwator.rops.krakow.pl/differenceanalysis/25",
    points: Object.keys(COUNTY_PATHS).map((id, index) => ({
      id,
      label: `Obszar testowy ${index + 1}`,
      value: index === 3 ? null : 2 + (index % 9),
    })),
  };
}

// Deterministic previews use the same answer contract, stream and D1 store as AI.
// Only saved catalog/report reads run here; no provider or statistics network calls.
export function makeDevChatAgent(agentId: AgentId = "odkrywaj"): ChatAgent {
  return async function* (history, signal) {
    signal.throwIfAborted();
    const text =
      history.findLast((entry) => entry.role === "user")?.content ?? "";
    const config = getAgentConfiguration(agentId);
    const answer: ChatAnswer = {
      message: "",
      areaLabel: "Małopolska",
      offers: [],
      sources: [...config.sources],
      artifact: null,
    };

    if (agentId === "odkrywaj") {
      const project = innovations.find(
        (entry) => entry.title === "BaWita" && entry.videos.length > 0,
      );
      if (!project)
        throw new Error("No catalog video available for DEV preview");
      const evidence = readInnovation(innovations, project.id);
      const challenges = readSocialChallenges(
        socialChallenges,
        "samotność seniorów",
      );
      answer.sources = [...evidence.sources, ...challenges.sources].slice(0, 8);
      answer.videos = config.getVideos?.(evidence.sources) ?? [];
      answer.message = `**${project.title}** to tablica rehabilitacyjna dla osób z demencją. Pomaga ćwiczyć pamięć i sprawność dłoni. Film pokazuje, jak działa rozwiązanie.`;
    } else if (agentId === "wiedza" || agentId === "wdrazanie-innowacji") {
      answer.visualizations = /wykres/i.test(text)
        ? [sampleVisualization("bar")]
        : /map/i.test(text)
          ? [sampleVisualization("map")]
          : [sampleVisualization("map"), sampleVisualization("bar")];
      const report = readReport({ topic: "seniorzy" });
      answer.message = `${report.facts[0]?.text ?? report.title}\n\nPoniżej ${answer.visualizations.length === 2 ? "mapa i wykres" : answer.visualizations[0].kind === "map" ? "mapa" : "wykres"} z przykładowymi danymi.`;
      if (agentId === "wdrazanie-innowacji") {
        answer.artifact = {
          title: "Plan wdrożenia klubu sąsiedzkiego",
          fields: [
            {
              label: "Cel",
              value: "Ograniczenie samotności seniorów.",
            },
            {
              label: "Zasoby",
              value: "Koordynator, sala spotkań i dwóch wolontariuszy.",
            },
            {
              label: "Partnerzy",
              value: "Biblioteka i ośrodek pomocy społecznej — propozycja.",
            },
            {
              label: "Pierwszy krok",
              value: "Przygotowanie spotkania organizacyjnego.",
            },
          ],
        };
        answer.message =
          "Zacznij od małej grupy i cotygodniowych spotkań w bibliotece. Wyznacz koordynatora, zaproś wolontariuszy i po miesiącu zbierz opinie uczestników. Poniżej plan wdrożenia i przykładowe dane regionu.";
      }
    } else if (agentId === "dodaj-pomysl") {
      answer.message =
        "Oto szkic klubu sąsiedzkiego:\n\n- **Problem:** samotność seniorów.\n- **Rozwiązanie:** cotygodniowe spotkania z wolontariuszami w bibliotece.\n- **Cel:** regularny kontakt i nowe relacje.\n\nMożesz przekazać ten pomysł do ROPS przez formularz poniżej.";
      answer.artifact = {
        title: "Social Canvas: klub sąsiedzki",
        ready: true,
        fields: [
          {
            label: "Opis pomysłu",
            value: "Klub spotkań seniorów i wolontariuszy.",
          },
          {
            label: "Problem",
            value: "Samotność i brak regularnego kontaktu z innymi.",
          },
          { label: "Odbiorcy", value: "Seniorzy mieszkający samotnie." },
          {
            label: "Rozwiązanie",
            value: "Cotygodniowe spotkania w bibliotece.",
          },
          {
            label: "Płatnicy i decydenci",
            value: "Gmina — finansowanie do uzgodnienia.",
          },
          {
            label: "Propozycja wartości",
            value: "Nowe relacje i wzajemna pomoc.",
          },
          {
            label: "Aktorzy zmiany",
            value: "Seniorzy, wolontariusze i bibliotekarze.",
          },
          {
            label: "Struktura kosztów",
            value: "Materiały, poczęstunek i czas koordynatora.",
          },
          {
            label: "Źródła dochodów",
            value: "Dotacja gminna — do pozyskania.",
          },
          {
            label: "Kanały dotarcia",
            value: "Ogłoszenia w bibliotece i ośrodku pomocy społecznej.",
          },
          {
            label: "Konstelacja partnerów",
            value: "Biblioteka i OPS — współpraca do uzgodnienia.",
          },
          {
            label: "Wpływ",
            value: "Mniejsza samotność; ocena w ankiecie po miesiącu.",
          },
        ],
      };
    } else {
      answer.message =
        "Przetestuj klub z 10 seniorami przez miesiąc. Zorganizuj cztery spotkania, sprawdź frekwencję i zapytaj uczestników, czy czują się mniej samotni. Na tej podstawie dopracuj kolejną edycję.";
      answer.artifact = {
        title: "Plan pilotażu klubu sąsiedzkiego",
        ready: true,
        fields: [
          {
            label: "Hipoteza",
            value: "Regularne spotkania zmniejszają poczucie samotności.",
          },
          { label: "Uczestnicy", value: "10 seniorów mieszkających samotnie." },
          { label: "Czas", value: "Cztery cotygodniowe spotkania." },
          {
            label: "Miara sukcesu",
            value: "Frekwencja i anonimowa ankieta po pilotażu.",
          },
          {
            label: "Informacja zwrotna",
            value: "Rozmowa podsumowująca i propozycje zmian.",
          },
        ],
      };
    }

    // Small progressive chunks exercise the existing streaming/reveal UI.
    for (let end = 80; end < answer.message.length; end += 80) {
      signal.throwIfAborted();
      yield { type: "text", text: answer.message.slice(0, end) };
    }
    signal.throwIfAborted();
    yield { type: "answer", answer };
  };
}
