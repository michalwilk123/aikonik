import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { buildConfig, createLocalReq, getPayload, type Payload } from "payload";
import { staffAuthPlugins } from "@/infrastructure/cms/auth";
import { submissions, users } from "@/infrastructure/cms/collections";
import { changeStaffPassword } from "@/infrastructure/cms/password-endpoint";
import { insertSubmission } from "@/infrastructure/cms/submissions";
import type { User } from "@/payload-types";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
let payload: Payload;
let worker: User;
let colleague: User;

before(async () => {
  fixture = await testDatabase();
  for (const [id, name] of [
    [1, "Pracownik"],
    [2, "Osoba prowadząca"],
  ] as const) {
    await fixture.db
      .prepare(
        "INSERT INTO users (id, name, role, email) VALUES (?, ?, 'cms', ?)",
      )
      .bind(id, name, `staff-${id}@example.pl`)
      .run();
  }
  payload = await getPayload({
    config: buildConfig({
      secret: "cms-integration-test-secret",
      routes: { api: "/api/cms" },
      collections: [submissions, users],
      plugins: staffAuthPlugins(
        "cms-integration-test-secret",
        "http://localhost:3000",
      ),
      db: sqliteD1Adapter({
        binding: fixture.db as unknown as D1Database,
        push: false,
      }),
    }),
  });
  worker = await payload.findByID({ collection: "users", id: 1 });
  colleague = await payload.findByID({ collection: "users", id: 2 });
});

after(async () => {
  await payload?.destroy();
  await fixture?.dispose();
});

test("staff manage every inbox while submitted contact data and Canvas remain immutable", async () => {
  const artifact = {
    title: "Pomoc sąsiedzka",
    fields: [{ label: "Odbiorcy", value: "Seniorzy" }],
  };
  for (const source of [
    "contact",
    "dodaj-pomysl",
    "testuj-innowacje",
  ] as const) {
    const id = crypto.randomUUID();
    await insertSubmission(fixture.db as unknown as D1Database, {
      id,
      source,
      name: "Anna",
      email: "anna@example.pl",
      subject: "Sprawa mieszkańca",
      message: "Oryginalna wiadomość",
      artifact,
    });
    const original = await payload.findByID({
      collection: "submissions",
      id,
      user: worker,
      overrideAccess: false,
    });
    assert.equal(original.status, "new");
    const updated = await payload.update({
      collection: "submissions",
      id,
      user: worker,
      overrideAccess: false,
      data: {
        status: "in-progress",
        assignedTo: colleague.id,
        internalNotes: "Kontakt w poniedziałek",
        subject: "Zmieniony temat",
        source: "contact",
        name: "Zmieniona osoba",
        email: "changed@example.pl",
        message: "Zmieniona wiadomość",
        artifact: null,
        details: "Zmieniony szkic",
        submittedAt: "2000-01-01T00:00:00Z",
      },
    });
    assert.equal(updated.status, "in-progress");
    assert.equal(
      typeof updated.assignedTo === "object"
        ? updated.assignedTo?.id
        : updated.assignedTo,
      colleague.id,
    );
    assert.equal(updated.internalNotes, "Kontakt w poniedziałek");
    for (const key of [
      "subject",
      "source",
      "name",
      "email",
      "message",
      "artifact",
      "details",
      "submittedAt",
    ] as const) {
      assert.deepEqual(updated[key], original[key], `${source}: ${key}`);
    }
    const assigned = await payload.find({
      collection: "submissions",
      user: worker,
      overrideAccess: false,
      where: {
        and: [
          { source: { equals: source } },
          { assignedTo: { equals: colleague.id } },
        ],
      },
    });
    assert.equal(assigned.totalDocs, 1);
    await payload.update({
      collection: "submissions",
      id,
      user: worker,
      overrideAccess: false,
      data: { status: "completed", assignedTo: null },
    });
    const closed = await payload.findByID({
      collection: "submissions",
      id,
      user: worker,
      overrideAccess: false,
    });
    assert.equal(closed.status, "completed");
    assert.equal(closed.assignedTo, null);
    await assert.rejects(
      payload.delete({
        collection: "submissions",
        id,
        user: worker,
        overrideAccess: false,
      }),
    );
  }
});

test("staff can choose a colleague but cannot change other accounts or expose submissions publicly", async () => {
  const directory = await payload.find({
    collection: "users",
    user: worker,
    overrideAccess: false,
  });
  assert.equal(directory.totalDocs, 2);
  assert.equal(
    directory.docs.some((user) => user.id === colleague.id),
    true,
  );
  assert.equal(
    directory.docs.every((user) => user.newPassword === undefined),
    true,
  );
  await assert.rejects(
    payload.update({
      collection: "users",
      id: colleague.id,
      user: worker,
      overrideAccess: false,
      data: { role: "admin" },
    }),
  );
  await assert.rejects(
    payload.find({ collection: "submissions", overrideAccess: false }),
  );
  await assert.rejects(
    payload.create({
      collection: "submissions",
      user: worker,
      overrideAccess: false,
      data: {
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        status: "new",
        source: "contact",
        subject: "Forbidden",
        name: "Anna",
        email: "anna@example.pl",
      },
    }),
  );
});

test("staff edit only their own notification settings and cannot elevate their role", async () => {
  const updated = await payload.update({
    collection: "users",
    id: worker.id,
    user: worker,
    overrideAccess: false,
    data: {
      emailNotifications: true,
      notificationEmail: "notify@example.pl",
      role: "admin",
    },
  });
  assert.equal(updated.role, "cms");
  assert.equal(updated.emailNotifications, true);
  assert.equal(updated.notificationEmail, "notify@example.pl");
  await assert.rejects(
    payload.update({
      collection: "users",
      id: colleague.id,
      user: worker,
      overrideAccess: false,
      data: {
        emailNotifications: true,
        notificationEmail: "stolen@example.pl",
      },
    }),
  );
  const other = await payload.findByID({
    collection: "users",
    id: worker.id,
    user: colleague,
    overrideAccess: false,
  });
  assert.equal(other.notificationEmail, undefined);
  assert.equal(other.emailNotifications, undefined);
  await assert.rejects(
    payload.update({
      collection: "users",
      id: worker.id,
      user: worker,
      overrideAccess: false,
      data: { notificationEmail: "invalid-email" },
    }),
  );
  const admin = { ...colleague, role: "admin" as const };
  const administered = await payload.update({
    collection: "users",
    id: worker.id,
    user: admin,
    overrideAccess: false,
    data: { emailNotifications: false, notificationEmail: null },
  });
  assert.equal(administered.emailNotifications, false);
  assert.equal(administered.notificationEmail, null);
});

test("password changes require permission, confirmation and the current password, and revoke sessions", async () => {
  const initial = "original-password";
  await payload.create({
    collection: "accounts",
    data: {
      user: worker.id,
      accountId: String(worker.id),
      providerId: "credential",
      password: await hashPassword(initial),
    },
  });
  await payload.create({
    collection: "sessions",
    data: {
      user: worker.id,
      token: "old-session",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  });
  async function change(
    user: User | undefined,
    id: number,
    body: object,
    origin = "http://localhost:3000",
  ) {
    const req = await createLocalReq(
      {
        user,
        req: {
          url: `http://localhost:3000/api/cms/users/${id}/change-password`,
          routeParams: { id: String(id) },
          headers: new Headers({ origin }),
          json: async () => body,
        },
      },
      payload,
    );
    return changeStaffPassword(req);
  }
  const input = {
    password: "changed-password",
    confirmation: "changed-password",
    currentPassword: initial,
  };
  assert.equal((await change(undefined, worker.id, input)).status, 401);
  assert.equal((await change(colleague, worker.id, input)).status, 403);
  assert.equal(
    (await change(worker, worker.id, input, "https://other.example")).status,
    403,
  );
  assert.equal(
    (await change(worker, worker.id, { ...input, confirmation: "mismatched" }))
      .status,
    400,
  );
  assert.equal(
    (
      await change(worker, worker.id, {
        ...input,
        password: "short",
        confirmation: "short",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await change(worker, worker.id, {
        ...input,
        currentPassword: "wrong-password",
      })
    ).status,
    400,
  );
  assert.equal((await payload.count({ collection: "sessions" })).totalDocs, 1);
  assert.equal((await change(worker, worker.id, input)).status, 200);
  const account = (await payload.find({ collection: "accounts" })).docs[0];
  assert.ok(account.password);
  assert.equal(
    await verifyPassword({ hash: account.password, password: input.password }),
    true,
  );
  assert.equal(
    await verifyPassword({ hash: account.password, password: initial }),
    false,
  );
  assert.equal((await payload.count({ collection: "sessions" })).totalDocs, 0);
  const admin = { ...colleague, role: "admin" as const };
  assert.equal(
    (
      await change(admin, worker.id, {
        password: initial,
        confirmation: initial,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await change(admin, colleague.id, {
        password: initial,
        confirmation: initial,
      })
    ).status,
    200,
  );
  assert.equal((await payload.count({ collection: "accounts" })).totalDocs, 2);
});
