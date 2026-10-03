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
