// DEV-only smoke using the local database; sends no email.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import type { RequestThread } from "@/app/(public)/zgloszenia/[id]/request-conversation";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    `${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/kontakt`,
  );
  await page
    .getByRole("link", { name: "Otwórz przykładowy czat", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Otwórz rozmowę", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Przykładowa rozmowa", exact: true })
    .waitFor();
  assert.equal(new URL(page.url()).hash, "");
  const id = new URL(page.url()).pathname.split("/").at(-1);
  const thread = await page.evaluate(async (requestId) => {
    const response = await fetch(`/api/requests/${requestId}`);
    return ((await response.json()) as { thread: RequestThread }).thread;
  }, id);
  const firstBubble = page
    .getByRole("list", { name: "Wiadomości w rozmowie" })
    .locator("li")
    .first();
  assert.equal(
    await firstBubble.getByText(thread.message ?? "", { exact: true }).count(),
    1,
  );
  const staffReply = thread.messages.find(
    (message) => message.author === "staff",
  );
  assert.ok(
    staffReply?.authorName && /\S+\s+\S+/.test(staffReply.authorName),
    "demo staff should have a full name",
  );
  assert.equal(
    await page.getByText(staffReply.authorName, { exact: true }).count(),
    1,
  );
  await page
    .getByLabel("Twoja odpowiedź")
    .fill("Dziękuję, to test przykładowej rozmowy.");
  await page
    .getByRole("button", { name: "Wyślij odpowiedź", exact: true })
    .click();
  await page
    .getByText("Dziękuję, to test przykładowej rozmowy.", { exact: true })
    .waitFor();
  const polled = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/requests/${id}`) &&
      response.request().method() === "GET",
  );
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  assert.equal((await polled).status(), 200);
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: "/tmp/hubmi-request-demo.png",
    fullPage: true,
  });
  process.stdout.write("Real DEV demo conversation flow passed.\n");
} finally {
  await browser.close();
}
