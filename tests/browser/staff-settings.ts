// Local database fixture; no emails or production credentials.
import assert from "node:assert/strict";
import { hashPassword } from "better-auth/crypto";
import { chromium } from "playwright-core";
import { getPlatformProxy } from "wrangler";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
if (new URL(baseURL).hostname !== "localhost")
  throw new Error("This fixture runs on localhost only.");
const proxy = await getPlatformProxy<CloudflareEnv>();
const db = proxy.env.DB;
const browser = await chromium.launch({ headless: true });
let workerId: number | undefined;
try {
  const email = `settings-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomUUID();
  const worker = await db
    .prepare(
      "INSERT INTO users(name,surname,email,role,email_verified) VALUES('Anna','Testowa',?,'cms',1) RETURNING id",
    )
    .bind(email)
    .first<{ id: number }>();
  assert.ok(worker);
  workerId = worker.id;
  await db
    .prepare(
      "INSERT INTO accounts(account_id,provider_id,user_id,password) VALUES(?,'credential',?,?)",
    )
    .bind(String(worker.id), worker.id, await hashPassword(password))
    .run();
  const page = await browser.newPage();
  await page.goto(`${baseURL}/kontakt`);
  const login = await page.evaluate(
    async (credentials) => {
      const response = await fetch("/api/cms/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      return { status: response.status, text: await response.text() };
    },
    { email, password },
  );
  assert.equal(login.status, 200, login.text);
  const response = await page.goto(
    `${baseURL}/admin/collections/users/${worker.id}`,
  );
  assert.equal(
    response?.status(),
    200,
    "worker's own settings page must not return 404",
  );
  await page.getByLabel(/^Imię/).waitFor();
  assert.equal(await page.getByLabel(/^Imię/).inputValue(), "Anna");
  assert.equal(
    await page.getByLabel("Nazwisko", { exact: true }).inputValue(),
    "Testowa",
  );
  assert.equal(
    await page
      .locator("nav.nav__wrap")
      .getByRole("link", { name: "Użytkownicy", exact: true })
      .count(),
    0,
    "user directory stays hidden from worker navigation",
  );
  process.stdout.write(
    "Worker can open own settings without exposing the user directory.\n",
  );
} finally {
  await browser.close();
  if (workerId) {
    await db
      .prepare("DELETE FROM sessions WHERE user_id=?")
      .bind(workerId)
      .run();
    await db
      .prepare("DELETE FROM accounts WHERE user_id=?")
      .bind(workerId)
      .run();
    await db.prepare("DELETE FROM users WHERE id=?").bind(workerId).run();
  }
  await proxy.dispose();
}
