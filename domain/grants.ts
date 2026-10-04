import { z } from "zod";

export const grantQuestionsSchema = z
  .array(
    z.object({
      key: z.string().regex(/^[a-z][a-z0-9_-]{0,49}$/),
      label: z.string().trim().min(1).max(150),
      help: z.string().trim().max(1000).default(""),
      required: z.boolean(),
      maxLength: z.number().int().min(50).max(2000),
    }),
  )
  .min(1)
  .max(24)
  .refine(
    (questions) =>
      new Set(questions.map((q) => q.key)).size === questions.length,
    "Identyfikatory pytań muszą być unikalne.",
  );
export type GrantQuestion = z.infer<typeof grantQuestionsSchema>[number];
export type GrantCall = {
  id: number;
  title: string;
  description: string;
  opensAt: string;
  closesAt: string;
  published: boolean;
  questions: GrantQuestion[];
  updatedAt: string;
};
export function callIsActive(call: GrantCall, now = Date.now()) {
  return (
    call.published &&
    Date.parse(call.opensAt) <= now &&
    now < Date.parse(call.closesAt)
  );
}
export const grantApplicationSchema = z
  .object({
    id: z.uuid(),
    callId: z.number().int().positive(),
    callVersion: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(150),
    email: z.string().trim().max(254).pipe(z.email()),
    consent: z.literal(true),
    answers: z.record(z.string(), z.string().trim().max(2000)),
  })
  .strict();
export type GrantApplication = z.infer<typeof grantApplicationSchema>;

export function validateGrantAnswers(
  call: GrantCall,
  answers: Record<string, string>,
) {
  if (
    Object.keys(answers).some(
      (key) => !call.questions.some((q) => q.key === key),
    )
  )
    throw new Error("Formularz naboru się zmienił. Odśwież stronę.");
  for (const question of call.questions) {
    const value = answers[question.key] ?? "";
    if (
      (question.required && !value.trim()) ||
      value.length > question.maxLength
    )
      throw new Error(
        `Sprawdź odpowiedź: ${question.label} (limit ${question.maxLength} znaków).`,
      );
  }
}
