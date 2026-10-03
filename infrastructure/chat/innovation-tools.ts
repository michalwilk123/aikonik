import { tool } from "ai";
import { z } from "zod";
import type { AgentSource } from "@/agents/types";
import {
  readInnovation,
  readSocialChallenges,
  searchInnovations,
} from "@/infrastructure/innovations/search";
import {
  innovations,
  socialChallenges,
} from "@/infrastructure/innovations/source";

export const innovationSearchSchema = z
  .object({
    query: z.string().trim().min(2).max(500),
    limit: z.number().int().min(1).max(5).default(5),
  })
  .strict();
export const innovationReadSchema = z
  .object({
    projectId: z.string().min(1).max(200),
    question: z.string().trim().min(2).max(500).optional(),
  })
  .strict();
const socialChallengesSchema = z
  .object({ query: z.string().trim().min(2).max(500) })
  .strict();

export function makeInnovationTools(
  onSources: (sources: AgentSource[]) => void,
) {
  return {
    search_innovations: tool({
      description:
        "Przeszukaj lokalną bibliotekę innowacji ROPS według potrzeb, odbiorców lub dokładnej nazwy. Zwraca maksymalnie 5 kandydatów, nie rekomendacje ani ranking skuteczności. Brak trafień oznacza brak dopasowania; nie zmieniaj problemu użytkownika, żeby dopasować projekt. Przed poleceniem odczytaj kandydata przez read_innovation.",
      inputSchema: innovationSearchSchema,
      execute: async ({ query, limit }) => {
        const candidates = searchInnovations(innovations, query, limit);
        onSources(candidates.map((candidate) => candidate.source));
        return {
          candidates,
          limitation:
            "Dopasowanie tekstu nie potwierdza skuteczności, naboru ani dostępności. Brak trafień nie oznacza, że taki program nie istnieje poza biblioteką.",
        };
      },
    }),
    read_innovation: tool({
      description:
        "Odczytaj źródłowy opis konkretnej innowacji i maksymalnie trzy pasujące fragmenty stron PDF. projectId wybierz z search_innovations. question zawęża fragmenty do potrzeb, działań, wymagań lub dowodów, o które pyta użytkownik. Zwrócone sourceIds identyfikują wykorzystaną dokumentację; brak PDF albo informacji nie uprawnia do ich wymyślania.",
      inputSchema: innovationReadSchema,
      execute: async ({ projectId, question }) => {
        const result = readInnovation(innovations, projectId, question);
        onSources(result.sources);
        return result;
      },
    }),
    read_social_challenges: tool({
      description:
        "Znajdź maksymalnie trzy fragmenty źródłowej Mapy wyzwań społecznych, np. samotność seniorów, opieka lub dostępność. Korzystaj z nich jako ramy diagnozy potrzeb i planowania działań. Mapa nie dowodzi skuteczności projektów i nie jest punktacją ani rankingiem innowacji.",
      inputSchema: socialChallengesSchema,
      execute: async ({ query }) => {
        const result = readSocialChallenges(socialChallenges, query);
        onSources(result.sources);
        return result;
      },
    }),
  };
}
