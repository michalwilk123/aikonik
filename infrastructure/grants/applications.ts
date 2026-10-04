import { ChatConflict } from "@/domain/chat/types";
import {
  callIsActive,
  type GrantApplication,
  type GrantCall,
  validateGrantAnswers,
} from "@/domain/grants";
import type { SubmissionInput } from "@/infrastructure/cms/submissions";
import { getGrantCall } from "@/infrastructure/grants/store";

export async function prepareGrantSubmission(
  db: D1Database,
  input: GrantApplication,
): Promise<SubmissionInput> {
  // A lost receipt can be retried after the deadline against its saved call version.
  const saved = await db
    .prepare(
      "SELECT call_snapshot FROM submissions WHERE id = ? AND source = 'grant-application'",
    )
    .bind(input.id)
    .first<{ call_snapshot: string | null }>();
  const call: GrantCall | null = saved?.call_snapshot
    ? JSON.parse(saved.call_snapshot)
    : await getGrantCall(db, input.callId);
  if (!call || call.id !== input.callId || (!saved && !callIsActive(call)))
    throw new ChatConflict(409, "Ten nabór nie przyjmuje teraz wniosków.");
  if (call.updatedAt !== input.callVersion)
    throw new ChatConflict(
      409,
      "Formularz naboru się zmienił. Odśwież stronę i sprawdź pytania przed wysłaniem.",
    );
  try {
    validateGrantAnswers(call, input.answers);
  } catch (error) {
    throw new ChatConflict(
      400,
      error instanceof Error ? error.message : "Sprawdź odpowiedzi.",
    );
  }
  return {
    id: input.id,
    source: "grant-application",
    name: input.name,
    email: input.email,
    subject: call.title,
    grantCallId: call.id,
    callSnapshot: call,
    artifact: {
      title: call.title,
      fields: call.questions.map((question) => ({
        label: question.label,
        value:
          input.answers[question.key]?.trim() || "Nie podano (pole opcjonalne)",
      })),
    },
  };
}
