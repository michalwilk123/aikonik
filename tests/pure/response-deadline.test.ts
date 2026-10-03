import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ResponseDeadlineError,
  withResponseDeadline,
} from "@/infrastructure/async/response-deadline";

test("a request that never settles stops waiting with a timeout error", async () => {
  await assert.rejects(
    withResponseDeadline(new Promise<never>(() => {}), 1),
    ResponseDeadlineError,
  );
});

test("returns completed responses and preserves provider errors", async () => {
  assert.equal(await withResponseDeadline(Promise.resolve("answer")), "answer");
  const failure = new Error("Provider unavailable");
  await assert.rejects(
    withResponseDeadline(Promise.reject(failure)),
    (error: unknown) => error === failure,
  );
});

test("a late server response cannot turn a timed-out request into success", async () => {
  let finish: ((value: string) => void) | undefined;
  const serverResponse = new Promise<string>((resolve) => {
    finish = resolve;
  });
  const request = withResponseDeadline(serverResponse, 1);
  await assert.rejects(request, ResponseDeadlineError);
  finish?.("late answer");
  await assert.rejects(request, ResponseDeadlineError);
});
