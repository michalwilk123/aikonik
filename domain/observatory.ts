import { z } from "zod";

export const observatoryVisualizationSchema = z.object({
  indicatorId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  year: z.number().int().min(1900).max(2100),
  sourceUrl: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.origin === "https://obserwator.rops.krakow.pl" &&
      /^\/(differenceanalysis|trendanalysis)\/\d+$/.test(url.pathname)
    );
  }),
  kind: z.enum(["map", "bar"]),
  unit: z.string().max(100).optional(),
  points: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        label: z.string().min(1).max(200),
        value: z.number().finite().nullable(),
        path: z.string().max(30000).optional(),
      }),
    )
    .min(1)
    .max(400),
});

export type ObservatoryVisualization = z.infer<
  typeof observatoryVisualizationSchema
>;

/** Compact numerical evidence shared by tool results and subsequent chat turns. */
export function summarizeObservatoryData(chart: ObservatoryVisualization) {
  const available = chart.points.filter(
    (point): point is typeof point & { value: number } => point.value !== null,
  );
  const ranked = [...available].sort((a, b) => a.value - b.value);
  const extreme = (point: (typeof available)[number] | undefined) =>
    point ? { area: point.label, value: point.value } : null;
  return {
    indicatorId: chart.indicatorId,
    title: chart.title,
    year: chart.year,
    unit: chart.unit ?? null,
    sourceUrl: chart.sourceUrl,
    kind: chart.kind,
    summary: {
      areasWithData: available.length,
      areasWithoutData: chart.points.length - available.length,
      minimum: extreme(ranked[0]),
      maximum: extreme(ranked.at(-1)),
      ...(available.length &&
      chart.points.every((point) => point.id.startsWith("POW_"))
        ? {
            unweightedCountyMean:
              available.reduce((total, point) => total + point.value, 0) /
              available.length,
          }
        : {}),
    },
    columns: ["obszar", "wartość (null = brak danych)"],
    data: chart.points.map(({ label, value }) => [label, value]),
  };
}
