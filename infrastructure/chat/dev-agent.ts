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

    if (agentId === "odkrywaj" || agentId === "wdrazanie-innowacji") {
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
      if (agentId === "wdrazanie-innowacji") {
        answer.sources = evidence.sources.slice(0, 8);
        answer.message = `**${project.title}** to tablica rehabilitacyjna dla osób z demencją. Poniżej roboczy przykład włączenia innowacji do usługi placówki dziennej opieki, dokumentacja i film. Organizacja zajęć jest propozycją do uzgodnienia z placówką.`;
        answer.artifact = {
          title: `Plan usługi: ${project.title} — placówka dziennej opieki`,
          fields: [
            {
              label: "Wybrana innowacja",
              value: `${project.title} — opis i dokumentacja z Biblioteki Innowacji Społecznych ROPS. Film ilustruje działanie.`,
            },
            {
              label: "Potrzeba i odbiorcy",
              value:
                "Przykładowy kontekst: zajęcia dla osób z demencją w placówce dziennej opieki. Potrzeby uczestników do rozpoznania.",
            },
            {
              label: "Co zachować i co dostosować",
              value:
                "Zachować mechanizm tablicy. Propozycja adaptacji: włączyć korzystanie z niej do zajęć placówki; zakres i częstotliwość uzgodnić z zespołem.",
            },
            {
              label: "Jak działa usługa",
              value:
                "Propozycja: zaproszenie uczestników przez zespół placówki, krótkie zajęcia z tablicą i zebranie opinii uczestników oraz opiekunów.",
            },
            {
              label: "Odpowiedzialność i partnerzy",
              value:
                "Koordynator po stronie placówki — do ustalenia. Kontakt z autorem w sprawie warunków użycia — proponowany krok, współpraca niepotwierdzona.",
            },
            {
              label: "Zasoby i koszty",
              value:
                "Tablica, miejsce i czas zespołu. Wymagania szkoleniowe, koszt pozyskania i prowadzenia zajęć — do ustalenia z dokumentacją i autorem.",
            },
            {
              label: "Pilotaż i ocena",
              value:
                "Propozycja: zacząć od małej grupy, obserwować udział i zebrać opinie. Czas i kryteria oceny uzgodnić przed pilotażem.",
            },
            {
              label: "Warunki i następny krok",
              value:
                "Sprawdzić instrukcję, warunki adaptacji i dostępność dla uczestników. Wyznaczyć osobę odpowiedzialną za przygotowanie pilotażu.",
            },
          ],
        };
      }
    } else if (agentId === "wiedza") {
      answer.visualizations = /wykres/i.test(text)
        ? [sampleVisualization("bar")]
        : /map/i.test(text)
          ? [sampleVisualization("map")]
          : [sampleVisualization("map"), sampleVisualization("bar")];
      const report = readReport({ topic: "seniorzy" });
      answer.message = `${report.facts[0]?.text ?? report.title}\n\nPoniżej ${answer.visualizations.length === 2 ? "mapa i wykres" : answer.visualizations[0].kind === "map" ? "mapa" : "wykres"} z przykładowymi danymi.`;
    } else if (agentId === "dodaj-pomysl") {
      answer.message =
        "Szkic klubu sąsiedzkiego jest gotowy. Sprawdź pola poniżej i przekaż pomysł do ROPS.";
      answer.artifact = {
        title: "Klub sąsiedzki",
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
            label: "Kto zapłaci i kto zdecyduje",
            value: "Gmina — finansowanie do uzgodnienia.",
          },
          {
            label: "Propozycja wartości",
            value: "Nowe relacje i wzajemna pomoc.",
          },
          {
            label: "Kto pomoże, a kto przeszkodzi",
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
            label: "Jak dotrzeć do odbiorców",
            value: "Ogłoszenia w bibliotece i ośrodku pomocy społecznej.",
          },
          {
            label: "Partnerzy",
            value: "Biblioteka i OPS — współpraca do uzgodnienia.",
          },
          {
            label: "Cel",
            value: "Mniejsza samotność; ocena w ankiecie po miesiącu.",
          },
        ],
      };
    } else {
      answer.message =
        "Plan pilotażu klubu jest gotowy. Sprawdź pola poniżej i przekaż go do ROPS.";
      answer.artifact = {
        title: "Plan pilotażu klubu sąsiedzkiego",
        ready: true,
        fields: [
          {
            label: "Co chcesz sprawdzić",
            value: "Regularne spotkania zmniejszają poczucie samotności.",
          },
          { label: "Uczestnicy", value: "10 seniorów mieszkających samotnie." },
          { label: "Termin", value: "Cztery cotygodniowe spotkania." },
          {
            label: "Miara sukcesu",
            value: "Frekwencja i anonimowa ankieta po pilotażu.",
          },
          {
            label: "Opinie uczestników",
            value: "Rozmowa podsumowująca i propozycje zmian.",
          },
        ],
      };
    }

    // Small progressive chunks exercise the existing streaming/reveal UI.
    const chunkSize = Math.min(80, Math.ceil(answer.message.length / 2));
    for (let end = chunkSize; end < answer.message.length; end += chunkSize) {
      signal.throwIfAborted();
      yield { type: "text", text: answer.message.slice(0, end) };
    }
    signal.throwIfAborted();
    yield { type: "answer", answer };
  };
}
