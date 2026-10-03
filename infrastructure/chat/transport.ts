import { type ChatEvent, chatEventSchema } from "@/domain/chat/types";

export function eventResponse(
  events: AsyncIterable<ChatEvent>,
  abort: AbortController,
) {
  const iterator = events[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) controller.close();
          else
            controller.enqueue(
              encoder.encode(`${JSON.stringify(next.value)}\n`),
            );
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        abort.abort();
        // Drain instead of return(): the aborted turn still records its model and
        // tool calls and finalizes through the runtime's normal error path.
        try {
          while (!(await iterator.next()).done);
        } catch {
          await iterator.return?.();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

// Handles split UTF-8 characters, multiple events per packet and truncated EOF.
export async function* readChatEvents(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminal = false;
  const onAbort = () => {
    void reader.cancel();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      if (buffer.length > 100000) throw new Error("Oversized chat event");
      if (done && buffer.trim()) {
        lines.push(buffer);
        buffer = "";
      }
      for (const line of lines) {
        if (line.length > 100000) throw new Error("Oversized chat event");
        if (!line.trim()) continue;
        if (terminal) throw new Error("Event after completion");
        const event = chatEventSchema.parse(JSON.parse(line));
        terminal = event.type === "complete" || event.type === "error";
        yield event;
      }
      if (done) break;
    }
    if (!terminal) throw new Error("Stream ended without completion");
  } finally {
    signal.removeEventListener("abort", onAbort);
    await reader.cancel();
    reader.releaseLock();
  }
}
