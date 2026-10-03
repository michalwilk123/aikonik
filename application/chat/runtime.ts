import { selectHistory } from "@/application/chat/context";
import type {
  ChatAnswer,
  ChatEvent,
  HistoryMessage,
  SendTurn,
} from "@/domain/chat/types";

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "answer"; answer: ChatAnswer }
  | {
      type: "model";
      step: number;
      model: string;
      provider?: string;
      firstTokenMs?: number;
      usage: { input?: number; output?: number };
      durationMs: number;
      finishReason: string;
    }
  | {
      type: "tool";
      id: string;
      name: string;
      input: unknown;
      output: unknown;
      durationMs?: number;
      status?: "complete" | "error";
    };
export type ChatAgent = (
  history: HistoryMessage[],
  signal: AbortSignal,
  log?: (
    event: Extract<AgentEvent, { type: "model" | "tool" }>,
  ) => Promise<void>,
) => AsyncIterable<AgentEvent>;
type AcceptedTurn = {
  history: HistoryMessage[];
  replay?: {
    text: string;
    answer: ChatAnswer | null;
    status: string;
    errorCode: string | null;
  };
};
export interface ChatStore {
  accept(
    input: SendTurn,
    browser: Record<string, unknown>,
  ): Promise<AcceptedTurn>;
  saveText(requestId: string, text: string): Promise<void>;
  log(
    requestId: string,
    event: Extract<AgentEvent, { type: "model" | "tool" }>,
    contextIds: string[],
  ): Promise<void>;
  finish(
    requestId: string,
    result: {
      status: "complete" | "error" | "interrupted";
      text: string;
      answer: ChatAnswer | null;
      firstTextMs: number | null;
      durationMs: number;
      errorCode: string | null;
      errorType?: string;
      errorStatus?: number;
    },
  ): Promise<void>;
}

const errorMessage = {
  generation_failed:
    "Nie udało się dokończyć odpowiedzi. Możesz wysłać kolejną wiadomość.",
  timeout: "Odpowiedź trwała zbyt długo. Możesz wysłać kolejną wiadomość.",
  interrupted: "Odpowiedź została zatrzymana.",
} as const;

export async function startTurn(
  store: ChatStore,
  agent: ChatAgent,
  input: SendTurn,
  browser: Record<string, unknown>,
  signal: AbortSignal,
) {
  const accepted = await store.accept(input, browser);
  const history = selectHistory(accepted.history);
  return run();

  async function* run(): AsyncGenerator<ChatEvent> {
    if (accepted.replay) {
      yield { type: "start", requestId: input.requestId };
      const old = accepted.replay;
      if (old.text) yield { type: "text", text: old.text };
      if (old.answer && old.status === "complete")
        yield { type: "complete", answer: old.answer };
      else {
        const code =
          old.errorCode === "timeout"
            ? "timeout"
            : old.status === "interrupted"
              ? "interrupted"
              : "generation_failed";
        yield { type: "error", code, message: errorMessage[code] };
      }
      return;
    }
    const started = Date.now();
    const deadline = AbortSignal.timeout(30000);
    const abort = AbortSignal.any([signal, deadline]);
    let text = "";
    let firstTextMs: number | null = null;
    let completed = false;
    try {
      yield { type: "start", requestId: input.requestId };
      abort.throwIfAborted();
      for await (const event of agent(history, abort, (event) =>
        store.log(
          input.requestId,
          event,
          history.map((message) => message.id),
        ),
      )) {
        if (event.type === "text" && abort.aborted) continue;
        if (event.type === "answer") abort.throwIfAborted();
        if (event.type === "text") {
          if (!event.text.startsWith(text))
            throw new Error("Non-monotonic text");
          text = event.text;
          if (text && firstTextMs === null) firstTextMs = Date.now() - started;
          // One canonical assistant row. Save every public update before sending
          // it, so a disconnect never leaves displayed text only in the browser.
          await store.saveText(input.requestId, text);
          yield { type: "text", text };
        } else if (event.type === "model" || event.type === "tool") {
          await store.log(
            input.requestId,
            event,
            history.map((m) => m.id),
          );
        } else {
          if (!event.answer.message.trim())
            throw new Error("Empty model answer");
          if (!event.answer.message.startsWith(text))
            throw new Error("Final answer rewrites streamed text");
          text = event.answer.message;
          await store.finish(input.requestId, {
            status: "complete",
            text,
            answer: event.answer,
            firstTextMs,
            durationMs: Date.now() - started,
            errorCode: null,
          });
          completed = true;
          yield { type: "complete", answer: event.answer };
          return;
        }
      }
      throw new Error("Stream ended without a validated answer");
    } catch (error) {
      const code = deadline.aborted
        ? "timeout"
        : signal.aborted
          ? "interrupted"
          : "generation_failed";
      // A failed save must not hide the error from the client; expiry later
      // releases a turn that could not be finalized.
      completed = true;
      await store
        .finish(input.requestId, {
          status: code === "interrupted" ? "interrupted" : "error",
          text,
          answer: null,
          firstTextMs,
          durationMs: Date.now() - started,
          errorCode: code,
          errorType:
            error instanceof Error ? error.name.slice(0, 100) : "UnknownError",
          errorStatus:
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
              ? error.statusCode
              : undefined,
        })
        .catch(() => {});
      yield { type: "error", code, message: errorMessage[code] };
    } finally {
      // Async iterator cancellation must also finalize the accepted turn.
      if (!completed)
        await store.finish(input.requestId, {
          status: "interrupted",
          text,
          answer: null,
          firstTextMs,
          durationMs: Date.now() - started,
          errorCode: "interrupted",
        });
    }
  }
}
