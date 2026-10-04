import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { insertSubmission } from "@/infrastructure/cms/submissions";
import {
  deliverCustomerNotification,
  ensureCustomerNotification,
} from "@/infrastructure/email/request-notifications";
import {
  authorizeCustomer,
  exchangeAccess,
  guardWrite,
  hash,
  linkToken,
} from "@/infrastructure/requests/security";
import {
  getStaffThread,
  getThread,
  postCustomerReply,
  postStaffReply,
  retryCustomerNotification,
} from "@/infrastructure/requests/service";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
let db: D1Database;
const config = {
  siteURL: "https://example.com",
  production: true,
  apiKey: "fake-key",
  from: "support@example.com",
  secret: "test-secret",
};
const local = { ...config, production: false };
const staff = { id: 1, role: "cms" as const };
const admin = { id: 2, role: "admin" as const };
before(async () => {
  fixture = await testDatabase();
  db = fixture.db as unknown as D1Database;
  await db
    .prepare(
      "INSERT INTO users(id,name,email,role) VALUES(1,'Worker','worker@example.com','cms'),(2,'Admin','admin@example.com','admin'),(3,'Other','other@example.com','cms')",
    )
    .run();
});
after(async () => fixture?.dispose());
async function submission() {
  const id = crypto.randomUUID();
  await insertSubmission(db, {
    id,
    source: "contact",
    name: "Anna",
    email: "anna@example.com",
    subject: "Pomoc",
    message: "Pierwsza wiadomość",
  });
  await db
    .prepare("UPDATE submissions SET assigned_to_id=1 WHERE id=?")
    .bind(id)
    .run();
  return id;
}
test("one-use fragment tokens exchange to scoped sessions and never authorize another request", async () => {
  const id = await submission();
  const notification = await ensureCustomerNotification(
    db,
    id,
    "receipt",
    local,
  );
  const token = await linkToken(local.secret, notification);
  const row = await db
    .prepare("SELECT token_hash FROM request_notifications WHERE id=?")
    .bind(notification)
    .first<{ token_hash: string }>();
  assert.equal(row?.token_hash, await hash(token));
  assert.notEqual(row?.token_hash, token);
  const sessions = await Promise.allSettled([
    exchangeAccess(db, id, token),
    exchangeAccess(db, id, token),
  ]);
  assert.equal(sessions.filter((r) => r.status === "fulfilled").length, 1);
  const success = sessions.find(
    (r) => r.status === "fulfilled",
  ) as PromiseFulfilledResult<string>;
  const req = new Request("https://example.com", {
    headers: { cookie: `request_session=${success.value}` },
  });
  await authorizeCustomer(db, req, id);
  await assert.rejects(authorizeCustomer(db, req, await submission()));
  await assert.rejects(exchangeAccess(db, id, token));
});
test("workers can only access assigned chats; notes stay private; every public reply gets a durable notification", async () => {
  const id = await submission();
  await assert.rejects(getStaffThread(db, id, { id: 3, role: "cms" }));
  await assert.rejects(
    postStaffReply(
      db,
      id,
      { id: crypto.randomUUID(), body: "Nie moje" },
      { id: 3, role: "cms" },
      local,
    ),
  );
  const reply = { id: crypto.randomUUID(), body: "Odpowiedź" };
  await postStaffReply(db, id, reply, staff, local);
  await postStaffReply(db, id, reply, staff, local);
  await postStaffReply(
    db,
    id,
    { id: crypto.randomUUID(), body: "Tylko pracownik", internal: true },
    admin,
    local,
  );
  await postCustomerReply(db, id, {
    id: crypto.randomUUID(),
    body: "Dziękuję",
  });
  const publicThread = await getThread(db, id);
  assert.equal(publicThread.message, "Pierwsza wiadomość");
  assert.equal(publicThread.messages.length, 2);
  assert.equal(JSON.stringify(publicThread).includes("Tylko pracownik"), false);
  const privateThread = await getStaffThread(db, id, staff);
  assert.equal(privateThread.messages.length, 3);
  assert.equal(privateThread.notifications.length, 1);
  await assert.rejects(
    postStaffReply(db, id, { ...reply, body: "Zmienione" }, staff, local),
  );
});
test("email failures persist and concurrent retries are safe and idempotent", async () => {
  const id = await submission();
  const notification = await ensureCustomerNotification(
    db,
    id,
    "receipt",
    config,
  );
  assert.equal(
    await deliverCustomerNotification(db, notification, config, async () => {
      throw new Error("provider unavailable");
    }),
    "failed",
  );
  let sent = 0;
  const keys: string[] = [];
  await Promise.all([
    deliverCustomerNotification(
      db,
      notification,
      config,
      async (_message, key) => {
        sent++;
        keys.push(key);
      },
    ),
    deliverCustomerNotification(db, notification, config, async () => {
      sent++;
    }),
  ]);
  assert.equal(sent, 1);
  assert.equal(keys[0], `request/${notification}`);
  assert.equal(
    await deliverCustomerNotification(db, notification, config, async () => {
      sent++;
    }),
    "sent",
  );
  assert.equal(sent, 1);
  await assert.rejects(
    retryCustomerNotification(
      db,
      id,
      notification,
      { id: 3, role: "cms" },
      local,
    ),
  );
});
test("local notifications never deliver email even with credentials", async () => {
  const id = await submission();
  const notification = await ensureCustomerNotification(
    db,
    id,
    "receipt",
    local,
  );
  let sent = false;
  assert.equal(
    await deliverCustomerNotification(db, notification, local, async () => {
      sent = true;
    }),
    "disabled",
  );
  assert.equal(sent, false);
});

test("each public staff reply sends one customer email, while retries and internal notes send none", async () => {
  const id = await submission();
  const sent: { to: string; text: string }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url, init) => {
    assert.equal(String(url), "https://api.resend.com/emails");
    sent.push(JSON.parse(String(init?.body)));
    return Response.json({ id: crypto.randomUUID() });
  }) as typeof fetch;
  try {
    const reply = { id: crypto.randomUUID(), body: "Pierwsza odpowiedź" };
    await postStaffReply(db, id, reply, staff, config);
    await postStaffReply(db, id, reply, staff, config);
    await postStaffReply(
      db,
      id,
      { id: crypto.randomUUID(), body: "Druga odpowiedź" },
      staff,
      config,
    );
    await postStaffReply(
      db,
      id,
      { id: crypto.randomUUID(), body: "Prywatna notatka", internal: true },
      staff,
      config,
    );
    assert.equal(sent.length, 2);
    for (const email of sent) {
      assert.equal(email.to, "anna@example.com");
      assert.match(email.text, new RegExp(`/zgloszenia/${id}#[a-f0-9]{64}`));
      assert.doesNotMatch(email.text, /Prywatna notatka/);
    }
    assert.equal(
      (await getStaffThread(db, id, staff)).notifications.every(
        (notification) => notification.status === "sent",
      ),
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("write requests require same origin", () => {
  assert.throws(() =>
    guardWrite(new Request("https://example.com/api", { method: "POST" })),
  );
  assert.throws(() =>
    guardWrite(
      new Request("https://example.com/api", {
        method: "POST",
        headers: { origin: "https://other.com" },
      }),
    ),
  );
  guardWrite(
    new Request("https://example.com/api", {
      method: "POST",
      headers: { origin: "https://example.com" },
    }),
  );
});

test("expired private links and sessions deny access", async () => {
  const id = await submission();
  const notification = await ensureCustomerNotification(
    db,
    id,
    "receipt",
    local,
  );
  const token = await linkToken(local.secret, notification);
  await db
    .prepare(
      "UPDATE request_notifications SET expires_at='2000-01-01T00:00:00Z' WHERE id=?",
    )
    .bind(notification)
    .run();
  await assert.rejects(exchangeAccess(db, id, token));
  const session = "expired-session";
  await db
    .prepare(
      "INSERT INTO request_sessions(token_hash,submission_id,expires_at) VALUES(?,?,'2000-01-01T00:00:00Z')",
    )
    .bind(await hash(session), id)
    .run();
  await assert.rejects(
    authorizeCustomer(
      db,
      new Request("https://example.com", {
        headers: { cookie: `request_session=${session}` },
      }),
      id,
    ),
  );
});
test("public staff bubbles expose full name and keep customer contact information private", async () => {
  const id = await submission();
  await db.prepare("UPDATE users SET surname='Kowalska' WHERE id=1").run();
  await postStaffReply(
    db,
    id,
    { id: crypto.randomUUID(), body: "Pomogę" },
    staff,
    local,
  );
  const thread = await getThread(db, id);
  assert.equal(thread.messages[0].authorName, "Worker Kowalska");
  assert.equal(JSON.stringify(thread).includes("anna@example.com"), false);
});

test("staff thread read evaluates assignment in the transcript snapshot", async () => {
  const id = await submission();
  await postStaffReply(
    db,
    id,
    { id: crypto.randomUUID(), body: "Poufna odpowiedź" },
    staff,
    local,
  );
  const reassignedDatabase = {
    prepare: db.prepare.bind(db),
    batch: async (statements: D1PreparedStatement[]) => {
      await db
        .prepare("UPDATE submissions SET assigned_to_id=3 WHERE id=?")
        .bind(id)
        .run();
      return db.batch(statements);
    },
  } as D1Database;
  await assert.rejects(getStaffThread(reassignedDatabase, id, staff));
  const newOwner = await getStaffThread(db, id, { id: 3, role: "cms" });
  assert.equal(newOwner.messages[0].body, "Poufna odpowiedź");
  assert.equal(newOwner.notifications.length, 1);
});

test("messages with identical timestamps preserve insertion order", async () => {
  const id = await submission();
  const first = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  const second = "00000000-0000-4000-8000-000000000000";
  await db.batch(
    [first, second].map((messageId, index) =>
      db
        .prepare(
          "INSERT INTO request_messages(id,submission_id,author,body,created_at) VALUES(?,?,'customer',?,'2026-01-01T00:00:00.000Z')",
        )
        .bind(messageId, id, String(index)),
    ),
  );
  assert.deepEqual(
    (await getThread(db, id)).messages.map((message) => message.id),
    [first, second],
  );
});
