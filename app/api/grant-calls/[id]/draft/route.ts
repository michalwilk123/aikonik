import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ChatConflict } from "@/domain/chat/types";
import { callIsActive } from "@/domain/grants";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { isDevMode } from "@/infrastructure/chat/dev-mode";
import {
  generateGrantDraft,
  grantDraftInputSchema,
} from "@/infrastructure/grants/draft";
import { getGrantCall } from "@/infrastructure/grants/store";
import {
  guardWrite,
  hash,
  rateLimit,
} from "@/infrastructure/requests/security";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "no-store" };
  try {
    guardWrite(request);
  } catch {
    return Response.json(
      { error: "Niedozwolone źródło żądania." },
      { status: 403, headers },
    );
  }
  try {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    await rateLimit(
      env.DB,
      `grant-draft:${await hash(request.headers.get("cf-connecting-ip") ?? "local")}`,
      20,
    );
    const call = await getGrantCall(env.DB, Number(id));
    if (!call || !callIsActive(call))
      return Response.json(
        { error: "Ten nabór nie przyjmuje teraz wniosków." },
        { status: 409, headers },
      );
    const body = await request.text();
    if (body.length > 60000)
      return Response.json(
        { error: "Opis jest zbyt długi." },
        { status: 400, headers },
      );
    const parsed = grantDraftInputSchema.safeParse(JSON.parse(body));
    if (!parsed.success)
      return Response.json(
        { error: "Opisz pomysł (20–4000 znaków)." },
        { status: 400, headers },
      );
    if (parsed.data.callVersion !== call.updatedAt)
      return Response.json(
        { error: "Formularz naboru się zmienił. Odśwież stronę." },
        { status: 409, headers },
      );
    if (
      Object.keys(parsed.data.answers).some(
        (key) => !call.questions.some((question) => question.key === key),
      )
    )
      return Response.json(
        { error: "Sprawdź pytania naboru." },
        { status: 400, headers },
      );
    if (isDevMode(env.DEV))
      return Response.json(
        {
          answers: Object.fromEntries(
            call.questions.map((question) => [
              question.key,
              parsed.data.answers[question.key] ?? "",
            ]),
          ),
          guidance:
            "Podgląd lokalny: uzupełnij odpowiedzi zgodnie z pytaniami. Model AI nie jest wywoływany.",
        },
        { headers },
      );
    const draft = await generateGrantDraft(
      call,
      parsed.data,
      createChatModel(env.OPENROUTER_API_KEY),
      AbortSignal.any([request.signal, AbortSignal.timeout(45000)]),
    );
    return Response.json(draft, { headers });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof ChatConflict
            ? error.message
            : "Nie udało się przygotować szkicu. Możesz wypełnić wniosek samodzielnie.",
      },
      {
        status:
          error instanceof ChatConflict
            ? error.status
            : error instanceof SyntaxError
              ? 400
              : 503,
        headers,
      },
    );
  }
}
