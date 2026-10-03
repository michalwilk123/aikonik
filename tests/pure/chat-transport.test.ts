import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChatEvent } from "@/domain/chat/types";
import { eventResponse, readChatEvents } from "@/infrastructure/chat/transport";

const answer = { message: "Zażółć 😀", areaLabel: "Małopolska", offers: [] };
async function collect(body: ReadableStream<Uint8Array>) {
  const events = [];
  for await (const event of readChatEvents(body, new AbortController().signal))
    events.push(event);
  return events;
}

test("parser handles byte-split Polish/emoji text and coalesced NDJSON events", async () => {
  const events: ChatEvent[] = [
    { type: "text", text: answer.message },
    { type: "complete", answer },
  ];
  const bytes = new TextEncoder().encode(
    events.map((event) => JSON.stringify(event)).join("\n"),
  );
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const byte of bytes) c.enqueue(Uint8Array.of(byte));
      c.close();
    },
  });
  assert.deepEqual(await collect(stream), events);
});

test("missing completion or malformed events fail rather than leaving a permanent spinner", async () => {
  for (const content of [
    '{"type":"text","text":"partial"}\n',
    "garbage\n",
    '{"type":"complete","answer":{}}\n',
  ]) {
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(content));
        c.close();
      },
    });
    await assert.rejects(collect(stream));
  }
});

test("a large coalesced packet of valid small events is accepted", async () => {
  const events: ChatEvent[] = Array.from({ length: 150 }, () => ({
    type: "text" as const,
    text: "x".repeat(1000),
  }));
  events.push({ type: "complete", answer });
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        ),
      );
      controller.close();
    },
  });
  assert.equal((await collect(stream)).length, events.length);
});

test("transport sends first event before generation finishes and cancellation aborts the producer", async () => {
  let stopped = false;
  const abort = new AbortController();
  const events = async function* (): AsyncGenerator<ChatEvent> {
    try {
      yield { type: "text", text: "first" };
      yield { type: "complete", answer };
    } finally {
      stopped = true;
    }
  };
  const response = eventResponse(events(), abort);
  assert.match(response.headers.get("cache-control") ?? "", /no-transform/);
  const reader = response.body?.getReader();
  assert.ok(reader);
  assert.match(new TextDecoder().decode((await reader.read()).value), /first/);
  await reader.cancel();
  assert.ok(abort.signal.aborted);
  assert.ok(stopped);
});
