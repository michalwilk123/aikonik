import { tool } from "ai";
import { z } from "zod";
import source from "@/docs/research/sources/rops-2025-uslugi-spoleczne-diagnoza.notes.json";

export const reportInputSchema = z.object({
  topic: z.enum(["seniorzy", "opieka", "wszystkie"]),
});
export function readReport(input: z.infer<typeof reportInputSchema>) {
  const { topic } = reportInputSchema.parse(input);
  return {
    sourceId: source.source_id,
    title: source.title,
    publicationYear: source.publication_year,
    dataYear: 2024,
    url: source.download_url,
    facts: source.facts
      .filter(
        (fact) =>
          topic === "wszystkie" ||
          (topic === "seniorzy" ? fact.pdf_page === 25 : fact.pdf_page === 26),
      )
      .map(({ id, pdf_page, text_pl }) => ({
        id,
        page: pdf_page,
        text: text_pl,
      })),
    limitation:
      "Dane regionalne z 2024 roku. Nie potwierdzają aktualnej dostępności usług.",
  };
}
export function makeReportTool() {
  return tool({
    description:
      "Odczytaj zatwierdzone fakty z raportu ROPS o Małopolsce. Tematy: seniorzy (populacja), opieka (usługi gminne i sąsiedzkie), wszystkie. Statystyki z 2024 r., z tytułem i stronami; brak aktualnego katalogu placówek.",
    inputSchema: reportInputSchema,
    execute: async (input) => readReport(input),
  });
}
