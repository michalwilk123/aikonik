import { expect, test } from "@playwright/test";

test("contact sends the consented form and only clears it after persistence succeeds", async ({
  page,
}) => {
  const submissions: Record<string, unknown>[] = [];
  await page.route("**/api/submissions", async (route) => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "receipt-contact" }),
    });
  });
  await page.goto("/kontakt");
  await page.getByLabel("Imię", { exact: true }).fill("Anna");
  await page
    .getByLabel("Adres e-mail", { exact: true })
    .fill("anna@example.pl");
  await page
    .getByLabel("Temat", { exact: true })
    .selectOption({ label: "Inny temat" });
  await page
    .getByLabel("Wiadomość", { exact: true })
    .fill("Chcę porozmawiać o inicjatywie.");
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  expect(submissions).toHaveLength(0);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Wiadomość została zapisana",
  );
  expect(submissions).toHaveLength(1);
  expect(submissions[0]).toMatchObject({
    source: "contact",
    name: "Anna",
    email: "anna@example.pl",
    consent: true,
  });
  await expect(page.getByLabel("Imię", { exact: true })).toBeEmpty();
});

for (const [source, label] of [
  ["dodaj-pomysl", "Dodaj pomysł"],
  ["testuj-innowacje", "Testuj innowacje"],
] as const) {
  test(`${label}: draft reaches the inbox only through the explicit consented submission`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const artifact = {
      title: "Mój Social Canvas",
      fields: [{ label: "Odbiorcy", value: "Seniorzy" }],
    };
    let turn: Record<string, unknown> = {};
    const submissions: Record<string, unknown>[] = [];
    await page.route("**/api/agents", async (route) => {
      turn = route.request().postDataJSON();
      await route.fulfill({
        contentType: "application/x-ndjson",
        body: `${JSON.stringify({ type: "complete", answer: { message: "Przejrzyj swój szkic.", areaLabel: "Małopolska", offers: [], artifact } })}\n`,
      });
    });
    await page.route("**/api/submissions", async (route) => {
      submissions.push(route.request().postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "receipt-idea" }),
      });
    });
    await page.goto("/asystent");
    await page.getByRole("button", { name: label, exact: true }).click();
    await page
      .getByRole("textbox", { name: "Wiadomość" })
      .fill("Chcę pomagać seniorom.");
    await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(
      page.getByRole("region", { name: "Roboczy szkic" }),
    ).toContainText("Seniorzy");
    expect(submissions).toHaveLength(0);
    await page
      .getByText("Przekaż ten szkic do ROPS Kraków", { exact: true })
      .click();
    await page.getByLabel("Imię", { exact: true }).fill("Anna");
    await page
      .getByLabel("Adres e-mail", { exact: true })
      .fill("anna@example.pl");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Wyślij zgłoszenie do ROPS", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Numer zgłoszenia" }),
    ).toContainText("receipt-idea");
    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toMatchObject({
      source,
      artifact,
      conversationId: turn.conversationId,
      capability: turn.capability,
      requestId: turn.requestId,
      consent: true,
    });
  });
}
