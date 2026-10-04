// Run against a local dev server: bun tests/browser/submission-flow.ts
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import type { SubmissionInput } from "@/domain/submissions/input";

const browser = await chromium.launch({ headless: true });
try {
  for (const source of ["dodaj-pomysl", "testuj-innowacje"] as const) {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let ready = false;
    let failSubmission = true;
    const conversationIds: string[] = [];
    const submissions: Exclude<SubmissionInput, { source: "contact" }>[] = [];
    await page.route("**/api/agents", async (route) => {
      const input = route.request().postDataJSON();
      conversationIds.push(input.conversationId);
      const answer = {
        message: ready
          ? "Szkic gotowy. Wybierz Dalej lub Anuluj."
          : "Proponuję huśtawkę i piaskownicę. Czy taki zestaw pasuje? Czy plac będzie dla dzieci z okolicy?",
        areaLabel: "Małopolska",
        offers: [],
        sources: [],
        artifact: {
          ready,
          title: "Plac zabaw",
          fields: [{ label: "Rozwiązanie", value: "Huśtawka i piaskownica" }],
        },
      };
      await route.fulfill({
        contentType: "application/x-ndjson",
        body: `${[
          { type: "start", requestId: input.requestId },
          { type: "complete", answer },
        ]
          .map((event) => JSON.stringify(event))
          .join("\n")}\n`,
      });
    });
    await page.route("**/api/submissions", async (route) => {
      submissions.push(route.request().postDataJSON());
      await route.fulfill({
        status: failSubmission ? 503 : 201,
        json: failSubmission
          ? { error: "Spróbuj ponownie." }
          : { id: "receipt" },
      });
    });
    await page.goto(
      `${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/asystent/${source}`,
    );
    const chat = page.locator("#agent-prompt");
    const form = page.getByRole("region", { name: "Formularz zgłoszenia" });
    await chat.fill("Chcę plac zabaw dla dzieci w parku");
    await page
      .getByRole("button", { name: "Wyślij wiadomość", exact: true })
      .click();
    await page.getByText("Czy taki zestaw pasuje?", { exact: false }).waitFor();
    assert.equal(await form.count(), 0);
    assert.equal(await chat.isDisabled(), false);
    ready = true;
    await chat.fill("tak");
    await page
      .getByRole("button", { name: "Wyślij wiadomość", exact: true })
      .click();
    await form.waitFor();
    assert.equal(await chat.isDisabled(), true);
    assert.equal(
      await page
        .getByRole("button", {
          name: "Czat zablokowany podczas wypełniania formularza",
        })
        .isDisabled(),
      true,
    );
    await form
      .getByLabel("Rozwiązanie")
      .fill("Huśtawka, piaskownica i zjeżdżalnia");
    for (const field of await form.getByRole("textbox").all()) {
      if (!(await field.inputValue())) await field.fill("Opis do zgłoszenia");
    }
    await form.getByRole("button", { name: "Dalej", exact: true }).click();
    await form.getByLabel("Imię", { exact: true }).fill("Anna");
    await form.getByLabel("Nazwisko", { exact: true }).fill("Kowalska");
    await form.getByLabel("Adres e-mail").fill("anna@example.pl");
    assert.equal(await chat.isDisabled(), true);
    await page
      .getByRole("navigation", { name: "Wybierz agenta" })
      .getByRole("button", { name: "Wiedza", exact: true })
      .click();
    await page.waitForURL("**/asystent/wiedza");
    await page.waitForFunction(
      () =>
        !document.querySelector<HTMLTextAreaElement>("#agent-prompt")?.disabled,
    );
    assert.equal(await chat.isDisabled(), false);
    await page
      .getByRole("navigation", { name: "Wybierz agenta" })
      .getByRole("button", {
        name: source === "dodaj-pomysl" ? "Dodaj pomysł" : "Testuj innowacje",
        exact: true,
      })
      .click();
    await page.waitForURL(`**/asystent/${source}`);
    await form.waitFor();
    assert.equal(await form.getByLabel("Nazwisko").inputValue(), "Kowalska");
    assert.equal(await chat.isDisabled(), true);
    await form.getByRole("button", { name: "Wstecz", exact: true }).click();
    assert.equal(
      await form.getByLabel("Rozwiązanie").inputValue(),
      "Huśtawka, piaskownica i zjeżdżalnia",
    );
    await form.getByRole("button", { name: "Dalej", exact: true }).click();
    assert.equal(
      await form.getByLabel("Imię", { exact: true }).inputValue(),
      "Anna",
    );
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Wyślij", exact: true }).click();
    await form.getByRole("alert").waitFor();
    assert.equal(await chat.isDisabled(), true);
    failSubmission = false;
    await form.getByRole("button", { name: "Wyślij", exact: true }).click();
    await page
      .getByText("Numer zgłoszenia: receipt", { exact: true })
      .waitFor();
    assert.equal(await chat.isDisabled(), false);
    if (source === "dodaj-pomysl") {
      assert.equal(await form.count(), 0);
      assert.equal(
        await page
          .getByRole("heading", { name: "Twój pomysł ma dobry początek." })
          .count(),
        1,
      );
      assert.equal(
        await page
          .getByText("Chcę plac zabaw dla dzieci w parku", { exact: true })
          .count(),
        0,
      );
      assert.equal(await chat.inputValue(), "");
      assert.equal(
        await page
          .getByRole("button", { name: "Wypełnij ręcznie", exact: true })
          .count(),
        1,
      );
    }
    assert.equal(submissions.length, 2);
    assert.deepEqual(submissions[0], submissions[1]);
    assert.equal(submissions[1].source, source);
    assert.equal(submissions[1].surname, "Kowalska");
    assert.equal(
      submissions[1].artifact.fields.find(
        (field) => field.label === "Rozwiązanie",
      )?.value,
      "Huśtawka, piaskownica i zjeżdżalnia",
    );
    await chat.fill("Zmień szkic");
    await page
      .getByRole("button", { name: "Wyślij wiadomość", exact: true })
      .click();
    await form.waitFor();
    if (source === "dodaj-pomysl") {
      assert.notEqual(conversationIds.at(-1), conversationIds[0]);
      assert.equal(
        await page
          .getByText("Numer zgłoszenia: receipt", { exact: true })
          .count(),
        0,
      );
    }
    await form.getByRole("button", { name: "Anuluj", exact: true }).click();
    assert.equal(await form.count(), 0);
    assert.equal(await chat.isDisabled(), false);
    if (source === "dodaj-pomysl") {
      await page
        .getByRole("button", { name: "Wypełnij ręcznie", exact: true })
        .click();
      for (const field of await form.getByRole("textbox").all()) {
        await field.fill("Nowy pomysł");
      }
      await form.getByRole("button", { name: "Dalej", exact: true }).click();
      assert.equal(
        await form.getByLabel("Imię", { exact: true }).inputValue(),
        "",
      );
      await form.getByLabel("Imię", { exact: true }).fill("Jan");
      await form.getByLabel("Nazwisko", { exact: true }).fill("Nowak");
      await form.getByLabel("Adres e-mail").fill("jan@example.pl");
      await form.getByRole("checkbox").check();
      await form.getByRole("button", { name: "Wyślij", exact: true }).click();
      await page.getByRole("status").waitFor();
      assert.equal(await form.count(), 0);
      assert.equal(
        await page
          .getByRole("heading", { name: "Twój pomysł ma dobry początek." })
          .count(),
        1,
      );
      await page
        .getByRole("button", { name: "Wypełnij ręcznie", exact: true })
        .click();
      for (const field of await form.getByRole("textbox").all()) {
        assert.equal(await field.inputValue(), "");
      }
      await form.getByRole("button", { name: "Anuluj", exact: true }).click();
    }
    await chat.fill("Mam poprawkę");
    assert.equal(
      await page
        .getByRole("button", { name: "Wyślij wiadomość", exact: true })
        .isDisabled(),
      false,
    );
    assert.deepEqual(errors, []);
    process.stdout.write(
      `${source}: interview, editing, back, tab switching, retry, send and cancel passed\n`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
