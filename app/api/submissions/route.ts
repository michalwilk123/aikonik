import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ChatConflict } from "@/domain/chat/types";
import {
  type SubmissionInput,
  submissionInputSchema,
} from "@/domain/submissions/input";
import { saveSubmission } from "@/infrastructure/cms/submissions";
import { verifyAgentSubmission } from "@/infrastructure/submissions/agent";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Niedozwolone źródło żądania." },
      { status: 403, headers },
    );
  let input: SubmissionInput;
  try {
    const body = await request.text();
    if (body.length > 80000) throw new Error("Oversized input");
    input = submissionInputSchema.parse(JSON.parse(body));
  } catch {
    return Response.json(
      {
        error: "Sprawdź wymagane pola i adres e-mail.",
      },
      { status: 400, headers },
    );
  }
  try {
    if (input.source === "contact") {
      const receipt = await saveSubmission(
        {
          id: input.id,
          source: input.source,
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        },
        request.url,
      );
      return Response.json(receipt, { status: 201, headers });
    }
    const artifact = await verifyAgentSubmission(
      getCloudflareContext().env.DB,
      input,
    );
    const receipt = await saveSubmission(
      {
        id: input.id,
        source: input.source,
        name: `${input.name} ${input.surname}`,
        email: input.email,
        subject: artifact.title,
        artifact,
        conversationId: input.conversationId,
        sourceTurnId: input.requestId,
      },
      request.url,
    );
    return Response.json(receipt, { status: 201, headers });
  } catch (error) {
    if (error instanceof ChatConflict)
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    return Response.json(
      { error: "Nie udało się zapisać zgłoszenia. Spróbuj ponownie." },
      { status: 503, headers },
    );
  }
}
