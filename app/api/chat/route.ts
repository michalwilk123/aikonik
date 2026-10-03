import { getCloudflareContext } from "@opennextjs/cloudflare";
import { startTurn } from "@/application/chat/runtime";
import {
  ChatConflict,
  type SendTurn,
  sendTurnSchema,
} from "@/domain/chat/types";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { makeD1ChatStore } from "@/infrastructure/chat/d1-store";
import { makeDevChatAgent } from "@/infrastructure/chat/dev-agent";
import { isDevMode } from "@/infrastructure/chat/dev-mode";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { eventResponse } from "@/infrastructure/chat/transport";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Niedozwolone źródło żądania." },
      { status: 403, headers },
    );
  let input: SendTurn;
  try {
    const body = await request.text();
    if (body.length > 12000) throw new Error("Oversized input");
    input = sendTurnSchema.parse(JSON.parse(body));
  } catch {
    return Response.json(
      { error: "Wiadomość musi mieć od 1 do 4000 znaków." },
      { status: 400, headers },
    );
  }
  const abort = new AbortController();
  const signal = AbortSignal.any([request.signal, abort.signal]);
  try {
    const { env } = getCloudflareContext();
    const store = makeD1ChatStore(env.DB);
    // Credential errors are generated inside the runtime, after the accepted
    // question/placeholder are saved, and therefore recorded like model errors.
    const agent: ReturnType<typeof makeChatAgent> = isDevMode(env.DEV)
      ? makeDevChatAgent(input.agentId)
      : (history, agentSignal, log) =>
          makeChatAgent(
            createChatModel(env.OPENROUTER_API_KEY ?? ""),
            input.agentId,
          )(history, agentSignal, log);
    const events = await startTurn(
      store,
      agent,
      input,
      {
        ...input.browser,
        userAgent: request.headers.get("user-agent")?.slice(0, 1000) ?? "",
        acceptLanguage:
          request.headers.get("accept-language")?.slice(0, 200) ?? "",
      },
      signal,
    );
    return eventResponse(events, abort);
  } catch (error) {
    if (error instanceof ChatConflict)
      return Response.json(
        { error: error.message, retry: error.retry },
        { status: error.status, headers },
      );
    return Response.json(
      { error: "Nie udało się zapisać wiadomości. Spróbuj ponownie." },
      { status: 503, headers },
    );
  }
}
