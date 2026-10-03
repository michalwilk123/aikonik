import { z } from "zod";

type SupportOfferAction =
  | { kind: "request"; label: string }
  | { kind: "details"; label: string }
  | { kind: "link"; label: string };

export type SupportOffer = {
  id: string;
  title: string;
  description: string;
  meta: string;
  badge?: string;
  action?: SupportOfferAction;
};

export const supportAnswerSchema = z.object({
  message: z.string().min(1).max(12000),
  areaLabel: z.string().min(1).max(200),
  offers: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        meta: z.string().max(500),
        badge: z.string().max(100).optional(),
      }),
    )
    .max(5),
});

export type SupportAnswer = z.infer<typeof supportAnswerSchema>;
