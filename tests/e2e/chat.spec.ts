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
async function fixture(page: Page, responseMessage = message) {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/agents", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: `${[
        { type: "text", text: responseMessage.slice(0, 50) },
        { type: "text", text: responseMessage },
        { type: "complete", answer: { ...answer, message: responseMessage } },
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
    .getByRole("textbox", { name: "Wiadomość" })
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

test("prepared idea sends successfully and keeps its generated canvas inside the chat", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/agents", async (route) => {
    const request = route.request().postDataJSON();
    requests.push(request);
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: `${JSON.stringify({
        type: "complete",
        answer: {
          ...answer,
          artifact: {
            title: "Sieć pomocy sąsiedzkiej",
            fields: [{ label: "Odbiorcy", value: "Seniorzy" }],
          },
        },
      })}\n`,
    });
  });
  await page.goto("/asystent");
  await page.getByRole("button", { name: "Dodaj pomysł", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Chcę stworzyć sieć sąsiedzkiej pomocy seniorom.",
    })
    .click();
  await expect(page.getByRole("textbox")).toHaveValue(
    "Chcę stworzyć sieć sąsiedzkiej pomocy seniorom.",
  );
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(page.locator(".chat-text")).toHaveText(message);
  expect(requests[0].agentId).toBe("dodaj-pomysl");
  expect(requests[0].text).toBe(
    "Chcę stworzyć sieć sąsiedzkiej pomocy seniorom.",
  );
  await expect(
    page.getByRole("region", { name: "Roboczy szkic" }),
  ).toContainText("Seniorzy");
  await expect(
    page.getByRole("alert").filter({ hasText: "Nie udało" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Asystent · Dodaj pomysł", { exact: true }),
  ).toHaveCount(0);
});

test("agent guidance sits below each welcome title and layout uses one centered width", async ({
  page,
}) => {
  await fixture(page);
  await expect(page.locator("aside")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nowa rozmowa" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Pobierz rozmowę" }),
  ).toHaveCount(0);
  for (const [agent, title, link] of [
    ["Odkrywaj", "Od potrzeby do możliwości.", "Zobacz raporty ROPS"],
    [
      "Dodaj pomysł",
      "Twój pomysł ma dobry początek.",
      "Otwórz arkusz Social Canvas (PDF)",
    ],
    [
      "Testuj innowacje",
      "Mały test. Ważna zmiana.",
      "Metoda: Nesta · plan testowania",
    ],
    [
      "Wdrażanie innowacji",
      "Sprawdzone rozwiązanie. Nowe miejsce.",
      "ROPS · innowacje w usługach społecznych",
    ],
  ]) {
    await page.getByRole("button", { name: agent, exact: true }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      page.getByRole("link", { name: link, exact: true }),
    ).toBeVisible();
  }
  const header = await page.locator("header").boundingBox();
  const headerContent = await page.locator("header > div").boundingBox();
  const welcome = await page.locator("section.agent-swap").boundingBox();
  const column = await page
    .locator("section.agent-swap")
    .locator("xpath=..")
    .boundingBox();
  const form = await page.locator("form").boundingBox();
  expect(header?.x).toBe(0);
  expect(header?.width).toBe(await page.evaluate(() => window.innerWidth));
  const center = (box: typeof header) => (box ? box.x + box.width / 2 : NaN);
  for (const box of [headerContent, welcome, form]) {
    expect(Math.abs(center(box) - center(column))).toBeLessThanOrEqual(1);
  }
  expect(form?.width).toBeLessThanOrEqual(column?.width ?? 0);
  expect(welcome?.width).toBeLessThanOrEqual(form?.width ?? 0);
});

test("agent tabs fit without horizontal scrolling at every viewport size", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixture(page);
  const nav = page.getByRole("navigation", { name: "Wybierz agenta" });
  const tabs = nav.locator("> div");
  for (const width of [320, 390, 640, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const label of [
      "Odkrywaj",
      "Dodaj pomysł",
      "Testuj innowacje",
      "Wdrażanie innowacji",
    ]) {
      const button = nav.getByRole("button", { name: label, exact: true });
      await expect(button).toBeInViewport();
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect
        .poll(() =>
          tabs.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        )
        .toBe(true);
      const fits = await button.evaluate((element) => {
        const container = element.parentElement?.getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        return (
          container &&
          bounds.left >= container.left &&
          bounds.right <= container.right &&
          element.scrollWidth <= element.clientWidth
        );
      });
      expect(fits).toBe(true);
    }
  }
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
  await page.getByRole("button", { name: "Zatrzymaj" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Odpowiedź" })
      .filter({ hasText: "Odpowiedź" }),
  ).toContainText("zatrzymana");
  await expect(
    page.getByRole("button", { name: "Wyślij wiadomość" }),
  ).toBeVisible();
  await page.getByRole("textbox").fill("Dalsze pytanie");
  await expect(
    page.getByRole("button", { name: "Wyślij wiadomość" }),
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
    name: "Wyślij wiadomość",
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
  const longMessage = message.repeat(4);
  await fixture(page, longMessage);
  await page.getByRole("textbox").fill("Potrzebuję wsparcia");
  await page.getByRole("textbox").press("Enter");
  await expect(page.locator(".chat-text")).not.toBeEmpty();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      ),
    )
    .toBeGreaterThan(320);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(320);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const scroll = await page.evaluate(() => window.scrollY);
  const text = page.locator(".chat-text");
  const revealed = (await text.textContent())?.length ?? 0;
  expect(revealed).toBeLessThan(longMessage.length);
  await expect
    .poll(async () => (await text.textContent())?.length ?? 0)
    .toBeGreaterThan(revealed);
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
  await expect(page.getByRole("button", { name: "Zatrzymaj" })).toBeVisible();
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
