import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ChatConflict } from "@/domain/chat/types";
import { type GrantApplication, grantApplicationSchema } from "@/domain/grants";
import { saveSubmission } from "@/infrastructure/cms/submissions";
import { prepareGrantSubmission } from "@/infrastructure/grants/applications";
import {
  guardWrite,
  hash,
  rateLimit,
} from "@/infrastructure/requests/security";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    guardWrite(request);
  } catch {
    return Response.json(
      { error: "Niedozwolone źródło żądania." },
      { status: 403, headers },
    );
  }
  const text = await request.text();
  let input: GrantApplication;
  try {
    if (text.length > 60000) throw new Error("Oversized input");
    input = grantApplicationSchema.parse(JSON.parse(text));
  } catch {
    return Response.json(
      { error: "Sprawdź dane kontaktowe, zgodę i odpowiedzi we wniosku." },
      { status: 400, headers },
    );
  }
  try {
    const { env } = getCloudflareContext();
    await rateLimit(
      env.DB,
      `grant-application:${await hash(request.headers.get("cf-connecting-ip") ?? "local")}`,
      10,
    );
    await rateLimit(
      env.DB,
      `grant-application-email:${await hash(input.email.toLowerCase())}`,
      5,
    );
    const submission = await prepareGrantSubmission(env.DB, input);
    return Response.json(await saveSubmission(submission, request.url), {
      status: 201,
      headers,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof ChatConflict
            ? error.message
            : "Nie udało się zapisać wniosku. Spróbuj ponownie.",
      },
      { status: error instanceof ChatConflict ? error.status : 503, headers },
    );
  }
}
