import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ChatConflict } from "@/domain/chat/types";
import { isDevMode } from "@/infrastructure/chat/dev-mode";
import { guardWrite } from "@/infrastructure/requests/security";
export const privateHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
export function requestEnvironment() {
  const { env, ctx } = getCloudflareContext();
  return {
    db: env.DB,
    ctx,
    config: {
      secret: env.PAYLOAD_SECRET,
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM_EMAIL,
      siteURL: env.SITE_URL,
      production: process.env.NODE_ENV === "production",
      dev: isDevMode(env.DEV),
    },
  };
}
export function requestError(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ChatConflict
          ? error.message
          : "Nie udało się obsłużyć zgłoszenia.",
    },
    {
      status: error instanceof ChatConflict ? error.status : 503,
      headers: privateHeaders,
    },
  );
}
export async function readWriteBody(request: Request) {
  guardWrite(request);
  const text = await request.text();
  if (text.length > 16000)
    throw new ChatConflict(400, "Wiadomość jest za długa.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ChatConflict(400, "Nieprawidłowe dane.");
  }
}
