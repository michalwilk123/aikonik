// Run against local DEV=true: bun tests/browser/grant-workflow.ts
import assert from "node:assert/strict";
import { hashPassword } from "better-auth/crypto";
import { chromium, type Page } from "playwright-core";
import { getPlatformProxy } from "wrangler";

async function browserRequest(
  page: Page,
  path: string,
  method: "POST" | "PATCH",
  data: unknown,
) {
  return page.evaluate(
    async ({ path, method, data }) => {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { status: response.status, text: await response.text() };
    },
    { path, method, data },
  );
}

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
if (new URL(baseURL).hostname !== "localhost")
  throw new Error("This fixture runs on localhost only.");
const proxy = await getPlatformProxy<CloudflareEnv>();
const db = proxy.env.DB;
const suffix = crypto.randomUUID();
const password = crypto.randomUUID();
const identities: { id: number; email: string; role: string }[] = [];
let callId: number | undefined;
let submissionId: string | undefined;
const browser = await chromium.launch({ headless: true });
try {
  for (const [role, name, surname] of [
    ["admin", "Admin", "Testowy"],
    ["cms", "Anna", "Kowalska"],
  ]) {
    const email = `${role}-${suffix}@example.invalid`;
    const row = await db
      .prepare(
        "INSERT INTO users(name,surname,email,role,email_verified) VALUES(?,?,?,?,1) RETURNING id",
      )
      .bind(name, surname, email, role)
      .first<{ id: number }>();
    assert.ok(row);
    identities.push({ ...row, email, role });
    await db
      .prepare(
        "INSERT INTO accounts(account_id,provider_id,user_id,password) VALUES(?,'credential',?,?)",
      )
      .bind(String(row.id), row.id, await hashPassword(password))
      .run();
  }
  const admin = await browser.newContext();
  const worker = await browser.newContext();
  const adminPage = await admin.newPage();
  const workerPage = await worker.newPage();
  for (const [page, identity] of [
    [adminPage, identities[0]],
    [workerPage, identities[1]],
  ] as const) {
    await page.goto(`${baseURL}/kontakt`);
    const response = await browserRequest(
      page,
      "/api/cms/auth/sign-in/email",
      "POST",
      { email: identity.email, password },
    );
    assert.equal(response.status, 200, response.text);
  }
  const created = await browserRequest(
    adminPage,
    "/api/cms/grant-calls",
    "POST",
    {
      title: `Grant przeglądarkowy ${suffix}`,
      description: "Testowy nabór w środowisku lokalnym.",
      published: true,
      opensAt: new Date(Date.now() - 3600000).toISOString(),
      closesAt: new Date(Date.now() + 3600000).toISOString(),
      questions: [
        {
          key: "problem",
          label: "Problem społeczny",
          help: "",
          required: true,
          maxLength: 2000,
        },
      ],
    },
  );
  assert.equal(created.status, 201, created.text);
  callId = (JSON.parse(created.text) as { doc: { id: number } }).doc.id;
  const customer = await browser.newPage();
  await customer.goto(`${baseURL}/nabory/${callId}`);
  await customer
    .getByLabel("Problem społeczny")
    .fill("Pomoc sąsiedzka dla seniorów.");
  await customer.getByRole("button", { name: "Sprawdź wniosek" }).click();
  await customer.getByLabel("Imię i nazwisko").fill("Maria Nowak");
  await customer.getByLabel("Adres e-mail").fill("customer@example.invalid");
  await customer.getByRole("checkbox").check();
  await customer.getByRole("button", { name: "Wyślij wniosek" }).click();
  const conversation = customer.getByRole("link", {
    name: "Podgląd rozmowy (środowisko deweloperskie)",
  });
  await conversation.waitFor();
  const href = await conversation.getAttribute("href");
  assert.ok(href);
  submissionId = new URL(href).pathname.split("/").at(-1);
  assert.ok(submissionId);
  const assign = await browserRequest(
    adminPage,
    `/api/cms/submissions/${submissionId}`,
    "PATCH",
    { assignedTo: identities[1].id },
  );
  assert.equal(assign.status, 200, assign.text);
  await adminPage.goto(`${baseURL}/admin`);
  await adminPage
    .getByRole("link", { name: "Wszystkie rozmowy", exact: true })
    .first()
    .waitFor();
  await adminPage
    .getByRole("link", { name: "Przypisz klienta do pracownika", exact: true })
    .first()
    .waitFor();
  await workerPage.goto(`${baseURL}/admin`);
  await workerPage
    .getByRole("link", { name: "Moje rozmowy", exact: true })
    .first()
    .waitFor();
  await workerPage.goto(
    `${baseURL}/admin/collections/submissions/${submissionId}`,
  );
  const chat = workerPage.getByRole("region", { name: "Rozmowa z klientem" });
  await chat
    .getByText("Pomoc sąsiedzka dla seniorów.", { exact: false })
    .waitFor();
  assert.equal(
    await workerPage
      .getByRole("link", { name: "Wszystkie rozmowy", exact: true })
      .count(),
    0,
  );
  await chat
    .getByLabel("Odpowiedź do klienta")
    .fill("Pomogę przygotować projekt.");
  await chat.getByRole("button", { name: "Wyślij", exact: true }).click();
  await chat
    .getByText("Pomogę przygotować projekt.", { exact: true })
    .waitFor();
  await conversation.click();
  await customer.getByRole("button", { name: "Otwórz rozmowę" }).click();
  await customer.getByText("Anna Kowalska", { exact: true }).waitFor();
  await customer
    .getByText("Pomoc sąsiedzka dla seniorów.", { exact: true })
    .waitFor();
  const closed = await browserRequest(
    adminPage,
    `/api/cms/grant-calls/${callId}`,
    "PATCH",
    { published: false },
  );
  assert.equal(closed.status, 200, closed.text);
  await customer.getByLabel("Twoja odpowiedź").fill("Dziękuję za odpowiedź.");
  await customer.getByRole("button", { name: "Wyślij odpowiedź" }).click();
  await customer.getByText("Dziękuję za odpowiedź.", { exact: true }).waitFor();
  await chat.getByText("Dziękuję za odpowiedź.", { exact: true }).waitFor();
  await workerPage.screenshot({
    path: "/tmp/hubmi-worker-chat.png",
    fullPage: true,
  });
  // biome-ignore lint/suspicious/noConsole: Browser script reports verification without credentials.
  console.log(
    "Grant submission → admin assignment → worker reply → account-free customer conversation passed.",
  );
} finally {
  await browser.close();
  if (submissionId)
    await db
      .prepare("DELETE FROM submissions WHERE id=?")
      .bind(submissionId)
      .run();
  if (callId)
    await db.prepare("DELETE FROM grant_calls WHERE id=?").bind(callId).run();
  for (const identity of identities) {
    await db
      .prepare("DELETE FROM sessions WHERE user_id=?")
      .bind(identity.id)
      .run();
    await db
      .prepare("DELETE FROM accounts WHERE user_id=?")
      .bind(identity.id)
      .run();
    await db.prepare("DELETE FROM users WHERE id=?").bind(identity.id).run();
  }
  await proxy.dispose();
}
