import { tool } from "ai";
import { z } from "zod";
import type { AgentId } from "@/agents/types";
import {
  type ObservatoryVisualization,
  observatoryVisualizationSchema,
  summarizeObservatoryData,
} from "@/domain/observatory";
import { loadObservatoryVisualization } from "@/infrastructure/observatory/source";

export const observatoryInputSchema = z
  .object({
    indicatorId: z.number().int().positive(),
    year: z.number().int().min(1990).max(2100).optional(),
  })
  .strict();

export function supportsObservatory(id?: AgentId) {
  return id === "odkrywaj" || id === "wdrazanie-innowacji";
}

export function makeObservatoryTools(
  onVisualization: (visualization: ObservatoryVisualization) => void,
  load = loadObservatoryVisualization,
) {
  const make = (kind: "map" | "bar") =>
    tool({
      description:
        kind === "map"
          ? "Pokaż interaktywną mapę wskaźnika z Małopolskiego Obserwatora ROPS w wiadomości czatu. Wybierz indicatorId z zatwierdzonego katalogu. Rok pominięty oznacza najnowszy dostępny. Nie każdy wskaźnik ma dane powiatowe; brak mapy jest zwracany jako błąd."
          : "Pokaż interaktywny wykres słupkowy wskaźnika z Małopolskiego Obserwatora ROPS w wiadomości czatu. Wybierz indicatorId z zatwierdzonego katalogu. Rok pominięty oznacza najnowszy dostępny. Dzietność to wskaźnik 135; porównuje Małopolskę i Polskę.",
      inputSchema: observatoryInputSchema,
      toModelOutput: ({ output }) => {
        const chart = observatoryVisualizationSchema.safeParse(output);
        return {
          type: "text",
          value: JSON.stringify(
            chart.success ? summarizeObservatoryData(chart.data) : output,
          ),
        };
      },
      execute: async (
        input,
        options,
      ): Promise<
        ObservatoryVisualization | { error: string; message: string }
      > => {
        try {
          const visualization = await load({
            ...input,
            kind,
            signal: options.abortSignal,
          });
          options.abortSignal?.throwIfAborted();
          onVisualization(visualization);
          return visualization;
        } catch {
          return {
            error: "visualization_unavailable",
            message:
              kind === "map"
                ? "Mapa nie jest dostępna dla tego wskaźnika lub roku. Możesz spróbować wykresu słupkowego; nie wymyślaj danych mapy."
                : "Nie udało się odczytać wykresu dla tego wskaźnika lub roku. Nie wymyślaj wartości; wyjaśnij brak danych użytkownikowi.",
          };
        }
      },
    });
  return { show_map: make("map"), show_bar_chart: make("bar") };
}
