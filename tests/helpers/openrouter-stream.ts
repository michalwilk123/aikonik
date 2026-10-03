import { MODEL_ID } from "@/infrastructure/ai/openrouter";

export function sseChunk(delta: unknown, finish: string | null = null) {
  return new TextEncoder().encode(
    `data: ${JSON.stringify({
      id: "fixture",
      object: "chat.completion.chunk",
      created: 1,
      model: MODEL_ID,
      choices: [{ index: 0, delta, finish_reason: finish }],
      ...(finish
        ? {
            usage: {
              prompt_tokens: 10,
              completion_tokens: 12,
              total_tokens: 22,
            },
          }
        : {}),
    })}\n\n`,
  );
}
export function streamResponse(chunks: Uint8Array[]) {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
export function answerStream(message: string) {
  const answer = JSON.stringify({
    message,
    areaLabel: "Małopolska",
    offers: [],
  });
  return streamResponse([
    sseChunk({ content: answer.slice(0, 25) }),
    sseChunk({ content: answer.slice(25) }),
    sseChunk({}, "stop"),
  ]);
}
