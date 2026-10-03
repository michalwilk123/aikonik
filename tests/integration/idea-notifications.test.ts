import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  insertSubmission,
  type SubmissionInput,
} from "@/infrastructure/cms/submissions";
import {
  emailDeliveryEnabled,
  notifyNewIdea,
  type SendNotification,
} from "@/infrastructure/email/idea-notifications";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
before(async () => {
  fixture = await testDatabase();
});
after(async () => {
  await fixture?.dispose();
});
const config = {
  production: true,
  apiKey: "test-token",
  from: "Hub <hub@example.pl>",
  siteURL: "https://hub.example.pl",
};
const idea: SubmissionInput = {
  id: crypto.randomUUID(),
  source: "dodaj-pomysl",
  subject: "Pomoc sąsiedzka",
  name: "Anna",
  email: "anna@example.pl",
};

test("delivery is disabled locally and without either Resend setting", () => {
  assert.equal(emailDeliveryEnabled(config), true);
  for (const siteURL of [
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://[::1]",
    "http://preview.localhost",
  ]) {
    assert.equal(emailDeliveryEnabled({ ...config, siteURL }), false);
  }
  assert.equal(emailDeliveryEnabled({ ...config, production: false }), false);
  assert.equal(emailDeliveryEnabled({ ...config, apiKey: "" }), false);
  assert.equal(emailDeliveryEnabled({ ...config, from: "" }), false);
});

test("only opted-in staff with a notification address receive private idea notifications", async () => {
  const db = fixture.db as unknown as D1Database;
  for (const [id, role, enabled, address] of [
    [1, "admin", 1, "admin-notify@example.pl"],
    [2, "cms", 1, "cms-notify@example.pl"],
    [3, "cms", 0, "disabled@example.pl"],
    [4, "cms", 1, null],
    [5, "cms", 1, "   "],
    [6, "visitor", 1, "visitor@example.pl"],
  ] as const) {
    await db
      .prepare(
        "INSERT INTO users (id, name, role, email, email_notifications, notification_email) VALUES (?, 'Staff', ?, ?, ?, ?)",
      )
      .bind(id, role, `login-${id}@example.pl`, enabled, address)
      .run();
  }
  const sent: { to: string; key: string; text: string }[] = [];
  const send: SendNotification = async (message, key) => {
    sent.push({ to: message.to, key, text: message.text });
  };
  await notifyNewIdea(db, idea, config, send);
  assert.deepEqual(
    sent.map((mail) => mail.to),
    ["admin-notify@example.pl", "cms-notify@example.pl"],
  );
  assert.equal(new Set(sent.map((mail) => mail.key)).size, 2);
  assert.match(
    sent[0].text,
    new RegExp(`/admin/collections/submissions/${idea.id}`),
  );
  sent.length = 0;
  for (const source of ["contact", "testuj-innowacje"] as const)
    await notifyNewIdea(db, { ...idea, source }, config, send);
  await notifyNewIdea(db, idea, { ...config, production: false }, send);
  assert.equal(sent.length, 0);
  let creates = 0;
  await Promise.all([
    insertSubmission(db, idea, () => {
      creates++;
    }),
    insertSubmission(db, idea, () => {
      creates++;
    }),
  ]);
  assert.equal(creates, 1);
  await insertSubmission(db, idea, () => {
    creates++;
  });
  assert.equal(creates, 1);
  // A provider failure must neither lose the saved idea nor prevent other recipients.
  let attempts = 0;
  await notifyNewIdea(db, idea, config, async () => {
    if (++attempts === 1) throw new Error("unavailable");
  });
  assert.equal(attempts, 2);
  assert.equal(
    await db
      .prepare("SELECT count(*) AS count FROM submissions WHERE id = ?")
      .bind(idea.id)
      .first("count"),
    1,
  );
});
