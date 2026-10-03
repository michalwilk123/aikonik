import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

const password = "LocalStaff-Test1";

test.beforeAll(() => {
  execFileSync("bun", ["run", "db:migrate:local"], { stdio: "pipe" });
  execFileSync("bun", ["run", "cms:seed"], {
    stdio: "pipe",
    env: { ...process.env, STAFF_INITIAL_PASSWORD: password },
  });
});

test("CMS worker can read submissions and cannot mutate them or read technical data", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("/admin/login");
  await page.locator("input[type=email]").fill("cms@hubmi.invalid");
  await page.locator("input[type=password]").fill(password);
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(`${baseURL}/admin`);
  await expect(
    page.getByRole("link", { name: "Zgłoszenia", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Użytkownicy", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/collections/submissions");
  await expect(
    page.getByRole("heading", { name: "Zgłoszenia", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Dodaj|Create New/ }),
  ).toHaveCount(0);

  const api = page.context().request;
  expect((await api.get("/api/cms/submissions")).status()).toBe(200);
  expect((await api.get("/api/cms/accounts")).status()).toBe(403);
  expect((await api.get("/api/cms/conversations")).status()).toBe(403);
  expect(
    (
      await api.post("/api/cms/submissions", { data: { subject: "Forbidden" } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await api.patch("/api/cms/submissions/missing", {
        data: { subject: "Forbidden" },
      })
    ).status(),
  ).toBe(403);
  expect((await api.delete("/api/cms/submissions/missing")).status()).toBe(403);
  expect((await request.get("/api/cms/submissions")).status()).toBe(403);
});

test("administrator can read every collection and provision staff credentials", async ({
  page,
  baseURL,
}) => {
  await page.goto("/admin/login");
  await page.locator("input[type=email]").fill("admin@hubmi.invalid");
  await page.locator("input[type=password]").fill(password);
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(`${baseURL}/admin`);
  const api = page.context().request;
  for (const collection of [
    "submissions",
    "users",
    "accounts",
    "sessions",
    "verifications",
    "conversations",
    "messages",
    "turns",
    "model-calls",
    "tool-calls",
    "prompt-versions",
  ]) {
    expect((await api.get(`/api/cms/${collection}`)).status(), collection).toBe(
      200,
    );
  }
  const email = `staff-test-${crypto.randomUUID()}@hubmi.invalid`;
  const created = await api.post("/api/cms/users", {
    data: {
      name: "Test staff",
      email,
      role: "cms",
      newPassword: "NewStaff-Test1",
    },
  });
  expect(created.status()).toBe(201);
  const { doc } = await created.json();
  expect(doc.newPassword).toBeUndefined();
  try {
    const signedIn = await api.post("/api/cms/auth/sign-in/email", {
      headers: { Origin: baseURL ?? "http://localhost:3199" },
      data: { email, password: "NewStaff-Test1" },
    });
    expect(signedIn.status()).toBe(200);
    await api.post("/api/cms/auth/sign-in/email", {
      headers: { Origin: baseURL ?? "http://localhost:3199" },
      data: { email: "admin@hubmi.invalid", password },
    });
    expect(
      (
        await api.patch(`/api/cms/users/${doc.id}`, {
          data: { newPassword: "ChangedStaff-Test1" },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await api.post("/api/cms/auth/sign-in/email", {
          headers: { Origin: baseURL ?? "http://localhost:3199" },
          data: { email, password: "NewStaff-Test1" },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await api.post("/api/cms/auth/sign-in/email", {
          headers: { Origin: baseURL ?? "http://localhost:3199" },
          data: { email, password: "ChangedStaff-Test1" },
        })
      ).status(),
    ).toBe(200);
  } finally {
    // Use a separate admin login after the test user replaced the request cookie.
    await api.post("/api/cms/auth/sign-in/email", {
      headers: { Origin: baseURL ?? "http://localhost:3199" },
      data: { email: "admin@hubmi.invalid", password },
    });
    expect((await api.delete(`/api/cms/users/${doc.id}`)).status()).toBe(200);
  }
});

test("staff registration and password recovery stay disabled", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/cms/auth/sign-up/email", {
        data: { email: "uninvited@hubmi.invalid", name: "Uninvited", password },
      })
    ).status(),
  ).not.toBe(200);
  expect(
    (
      await request.post("/api/cms/users/first-register", {
        data: { email: "uninvited@hubmi.invalid", password },
      })
    ).status(),
  ).not.toBe(200);
  expect(
    (
      await request.post("/api/cms/auth/request-password-reset", {
        data: { email: "cms@hubmi.invalid" },
      })
    ).status(),
  ).not.toBe(200);
});
