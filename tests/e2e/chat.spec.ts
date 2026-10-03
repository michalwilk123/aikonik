import { expect, type Page, test } from "@playwright/test";

const message =
  "W Tarnowie możesz zacząć od rozmowy z lokalnym ośrodkiem pomocy społecznej. ".repeat(
    8,
  );
const answer = {
  message,
  areaLabel: "Tarnów",
  offers: [
    {
      id: "one",
      title: "Pomoc sąsiedzka",
      description: "Propozycja do sprawdzenia",
      meta: "Tarnów",
    },
  ],
  sources: [
    {
      id: "fixture-source",
      title: "Raport fixture",
      url: "https://rops.krakow.pl/",
      excerpt: "Dane z 2024 roku",
      page: 26,
    },
  ],
  artifact: null,
};
async function fixture(page: Page) {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/agents", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: `${[
        { type: "text", text: message.slice(0, 50) },
        { type: "text", text: message },
        { type: "complete", answer },
      ]
        .map((event) => JSON.stringify(event))
        .join("\n")}\n`,
    });
  });
  await page.goto("/asystent");
  return requests;
}

test("burst response reveals smoothly, holds cards until text drains and sends only the current message", async ({
  page,
}) => {
  const requests = await fixture(page);
  await page
    .getByRole("textbox", { name: "Wiadomość · Odkrywaj" })
    .fill("Mieszkam w Tarnowie");
  await page.getByRole("textbox").press("Enter");
  const text = page.locator(".chat-text").first();
  await expect(text).not.toBeEmpty();
  const initial = (await text.textContent())?.length ?? 0;
  expect(initial).toBeGreaterThan(0);
  expect(initial).toBeLessThan(message.length);
  await expect(page.getByText("Źródła · 1", { exact: true })).toBeHidden();
  await expect(text).toHaveText(message, { timeout: 10000 });
  await expect(page.getByText("Źródła · 1", { exact: true })).toBeVisible();
  await page.getByRole("textbox").fill("A dla mamy?");
  await page.getByRole("textbox").press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0].conversationId).toBe(requests[1].conversationId);
  expect(requests[0].capability).toBe(requests[1].capability);
  expect(requests[0].requestId).not.toBe(requests[1].requestId);
  expect(requests[1].text).toBe("A dla mamy?");
  expect(requests[1]).not.toHaveProperty("messages");
  expect(requests[1]).not.toHaveProperty("history");
  await page.screenshot({
    path: "test-results/chat-desktop.png",
    fullPage: true,
  });
});

test("reduced motion reveals immediately and new conversation clears only the current UI identity", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests = await fixture(page);
  await page.getByRole("textbox").fill("Pierwsza rozmowa");
  await page.getByRole("textbox").press("Enter");
  await expect(page.locator(".chat-text")).toHaveText(message);
  await page.getByRole("button", { name: "Nowa rozmowa" }).click();
  await expect(page.locator(".chat-text")).toHaveCount(0);
  await page.getByRole("textbox").fill("Druga rozmowa");
  await page.getByRole("textbox").press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0].conversationId).not.toBe(requests[1].conversationId);
});

test("stop releases a stalled request and leaves a usable composer", async ({
  page,
}) => {
  await page.route("**/api/agents", async (route) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    await route.abort().catch(() => {});
  });
  await page.goto("/asystent");
  await page.getByRole("textbox").fill("Wiadomość");
  await page.getByRole("textbox").press("Enter");
  await page.getByRole("button", { name: "Zatrzymaj · Odkrywaj" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Odpowiedź" })
      .filter({ hasText: "Odpowiedź" }),
  ).toContainText("zatrzymana");
  await expect(
    page.getByRole("button", { name: "Wyślij wiadomość · Odkrywaj" }),
  ).toBeVisible();
  await page.getByRole("textbox").fill("Dalsze pytanie");
  await expect(
    page.getByRole("button", { name: "Wyślij wiadomość · Odkrywaj" }),
  ).toBeEnabled();
});

test("mobile composer supports multiline input and stays inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page);
  const textbox = page.getByRole("textbox");
  await textbox.fill("Pierwsza linia");
  await textbox.press("Shift+Enter");
  await textbox.pressSequentially("Druga linia");
  await expect(textbox).toHaveValue("Pierwsza linia\nDruga linia");
  const button = page.getByRole("button", {
    name: "Wyślij wiadomość · Odkrywaj",
  });
  await expect(button).toBeInViewport();
  await button.click();
  await expect(page.locator(".chat-text")).not.toBeEmpty();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/chat-mobile.png",
    fullPage: true,
  });
});

test("scrolling up is respected while more text is revealed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await fixture(page);
  await page.getByRole("textbox").fill("Potrzebuję wsparcia");
  await page.getByRole("textbox").press("Enter");
  await expect(page.locator(".chat-text")).not.toBeEmpty();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
    .toBeGreaterThan(1000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(
    page.getByRole("button", { name: "Najnowsza wiadomość" }),
  ).toBeVisible();
  const scroll = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
});

test("rapid streamed packets reveal before completion and reduced motion drains the current buffer", async ({
  page,
}) => {
  await page.addInitScript(
    ({ message, answer }) => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        if (input !== "/api/agents") return originalFetch(input, init);
        const encoder = new TextEncoder();
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                let length = 0;
                const timer = setInterval(() => {
                  length = Math.min(message.length, length + 3);
                  controller.enqueue(
                    encoder.encode(
                      `${JSON.stringify({ type: "text", text: message.slice(0, length) })}\n`,
                    ),
                  );
                  if (length === message.length) {
                    clearInterval(timer);
                    controller.enqueue(
                      encoder.encode(
                        `${JSON.stringify({ type: "complete", answer })}\n`,
                      ),
                    );
                    controller.close();
                  }
                }, 5);
              },
            }),
            { headers: { "Content-Type": "application/x-ndjson" } },
          ),
        );
      };
    },
    { message, answer },
  );
  await page.goto("/asystent");
  await page.getByRole("textbox").fill("Syntetyczne pytanie");
  await page.getByRole("textbox").press("Enter");
  const text = page.locator(".chat-text");
  await expect(text).not.toBeEmpty();
  await expect(
    page.getByRole("button", { name: "Zatrzymaj · Odkrywaj" }),
  ).toBeVisible();
  const first = (await text.textContent())?.length ?? 0;
  await expect
    .poll(async () => (await text.textContent())?.length ?? 0)
    .toBeGreaterThan(first);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(text).toHaveText(message);
  await expect(page.getByText("Źródła · 1", { exact: true })).toBeVisible();
});

test("switching agents keeps separate identities, histories and drafts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests = await fixture(page);
  await page.getByRole("textbox").fill("Rozmowa odkrywania");
  await page.getByRole("textbox").press("Enter");
  await expect(page.locator(".chat-text")).toHaveText(message);
  await page.getByRole("textbox").fill("Szkic pytania odkrywania");
  await page.getByRole("button", { name: "Dodaj pomysł", exact: true }).click();
  await expect(page.locator(".chat-text")).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveValue("");
  await page.getByRole("textbox").fill("Pomysł na warsztaty");
  await page.getByRole("textbox").press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0].agentId).toBe("odkrywaj");
  expect(requests[1].agentId).toBe("dodaj-pomysl");
  expect(requests[0].conversationId).not.toBe(requests[1].conversationId);
  await page.getByRole("button", { name: "Odkrywaj", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(
    "Szkic pytania odkrywania",
  );
  await expect(page.locator(".chat-text")).toHaveText(message);
  await expect(
    page.getByText("Pomysł na warsztaty", { exact: true }),
  ).toHaveCount(0);
});
