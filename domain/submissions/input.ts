import { z } from "zod";
import { artifactSchema } from "@/agents/types";

const contactFields = {
  id: z.uuid(),
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().max(254).pipe(z.email()),
};
export const submissionInputSchema = z.discriminatedUnion("source", [
  z
    .object({
      ...contactFields,
      source: z.literal("contact"),
      subject: z.enum([
        "Pytanie o Hub",
        "Chcę zgłosić inicjatywę",
        "Chcę zostać wolontariuszem",
        "Problem z dostępnością strony",
        "Inny temat",
      ]),
      message: z.string().trim().min(1).max(12000),
    })
    .strict(),
  z
    .object({
      ...contactFields,
      source: z.enum(["dodaj-pomysl", "testuj-innowacje"]),
      consent: z.literal(true),
      conversationId: z.uuid(),
      capability: z.uuid(),
      requestId: z.uuid(),
      artifact: artifactSchema.refine((artifact) => artifact.fields.length > 0),
    })
    .strict(),
]);
export type SubmissionInput = z.infer<typeof submissionInputSchema>;
