export class ResponseDeadlineError extends Error {
  constructor() {
    super("The chat response deadline expired");
    this.name = "ResponseDeadlineError";
  }
}

// A server-side model timeout cannot cover a stalled browser/action transport.
export async function withResponseDeadline<T>(
  response: Promise<T>,
  timeoutMs = 45000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      response,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new ResponseDeadlineError()),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
