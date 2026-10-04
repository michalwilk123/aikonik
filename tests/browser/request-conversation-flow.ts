// Run against a local dev server: bun tests/browser/request-conversation-flow.ts
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import type { RequestThread } from "@/app/(public)/zgloszenia/[id]/request-conversation";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const requestId = "1ab4aef7-679b-4ba9-9a44-90f0c258a7a3";
  const endpoint = `/api/requests/${requestId}`;
  const token = "a".repeat(64);
  let authenticated = false;
  let accesses = 0;
  let failReply = true;
  let lastRecoveryEmail: string | null = null;
  let delayGet = false;
  let releaseGet: (() => Promise<void>) | undefined;
  let notifyGet: (() => void) | undefined;
  const getStarted = new Promise<void>((resolve) => {
    notifyGet = resolve;
  });
  const replies: { id: string; body: string }[] = [];
  const thread: RequestThread = {
    id: requestId,
    subject: "Wniosek grantowy",
    submittedAt: "2026-10-04T08:00:00Z",
    status: "new",
    message: "Treść zgłoszenia",
    artifact: null,
    messages: [
      {
        id: "staff",
        author: "staff",
        body: "Proszę doprecyzować koszt <script>",
        createdAt: "2026-10-04T09:00:00Z",
      },
    ],
  };
  await page.route(`**${endpoint}/access`, async (route) => {
    accesses++;
    assert.deepEqual(route.request().postDataJSON(), { token });
    authenticated = true;
    await route.fulfill({ json: { success: true } });
  });
  await page.route(`**${endpoint}/link`, async (route) => {
    lastRecoveryEmail = route.request().postDataJSON().email;
    await route.fulfill({
      json: {
        message: "Jeśli adres pasuje do zgłoszenia, wyślemy prywatny link.",
      },
    });
  });
  await page.route(`**${endpoint}`, async (route) => {
    if (!authenticated)
      return route.fulfill({
        status: 403,
        json: { error: "Otwórz prywatny link." },
      });
    if (route.request().method() === "POST") {
      const input = route.request().postDataJSON();
      replies.push(input);
      if (failReply)
        return route.fulfill({
          status: 503,
          json: { error: "Spróbuj ponownie." },
        });
      thread.messages.push({
        id: input.id,
        body: input.body,
        author: "customer",
        createdAt: "2026-10-04T10:00:00Z",
      });
    }
    if (delayGet && route.request().method() === "GET") {
      delayGet = false;
      const snapshot = JSON.stringify({ thread });
      releaseGet = () =>
        route.fulfill({ contentType: "application/json", body: snapshot });
      notifyGet?.();
      return;
    }
    await route.fulfill({ json: { thread } });
  });
  await page.goto(
    `${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/zgloszenia/${requestId}#${token}`,
  );
  const open = page.getByRole("button", {
    name: "Otwórz rozmowę",
    exact: true,
  });
  await open.waitFor();
  assert.equal(accesses, 0, "opening page must not consume a single-use token");
  assert.equal(new URL(page.url()).hash, "");
  assert.equal(
    await page.getByText("Treść zgłoszenia", { exact: true }).count(),
    0,
  );
  await open.click();
  await page.getByRole("heading", { name: thread.subject }).waitFor();
  assert.equal(accesses, 1);
  assert.equal(
    await page
      .locator("script")
      .filter({ hasText: "Proszę doprecyzować" })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByText("Proszę doprecyzować koszt <script>", { exact: true })
      .count(),
    1,
  );
  const body = page.getByLabel("Twoja odpowiedź");
  await body.fill("Koszt wynosi 5000 zł");
  await page
    .getByRole("button", { name: "Wyślij odpowiedź", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Spróbuj ponownie." })
    .waitFor();
  assert.equal(await body.inputValue(), "Koszt wynosi 5000 zł");
  delayGet = true;
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await getStarted;
  failReply = false;
  await page
    .getByRole("button", { name: "Wyślij odpowiedź", exact: true })
    .click();
  await page.getByText("Wiadomość została wysłana.", { exact: true }).waitFor();
  assert.equal(replies.length, 2);
  assert.deepEqual(
    replies[0],
    replies[1],
    "retry must reuse the idempotency key",
  );
  assert.equal(await body.inputValue(), "");
  const staleResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(endpoint) &&
      response.request().method() === "GET",
  );
  await releaseGet?.();
  await staleResponse;
  assert.equal(
    await page.getByText("Koszt wynosi 5000 zł", { exact: true }).count(),
    1,
    "stale poll must not remove the newer sent reply",
  );
  await body.fill("Niewysłany szkic");
  authenticated = false;
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await page
    .getByRole("heading", { name: "Wyślij nowy link do rozmowy" })
    .waitFor();
  await page.getByLabel("Adres e-mail ze zgłoszenia").fill("anna@example.pl");
  await page
    .getByRole("button", { name: "Wyślij prywatny link", exact: true })
    .click();
  await page
    .getByText("Jeśli adres pasuje do zgłoszenia, wyślemy prywatny link.", {
      exact: true,
    })
    .waitFor();
  assert.equal(lastRecoveryEmail, "anna@example.pl");
  authenticated = true;
  await page.reload();
  await page.getByRole("heading", { name: thread.subject }).waitFor();
  assert.deepEqual(errors, []);
  process.stdout.write("Customer conversation browser flow passed.\n");
} finally {
  await browser.close();
}
