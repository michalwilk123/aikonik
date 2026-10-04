import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { type GrantApplication, grantApplicationSchema } from "@/domain/grants";
import { insertSubmission } from "@/infrastructure/cms/submissions";
import { prepareGrantSubmission } from "@/infrastructure/grants/applications";
import { getGrantCall } from "@/infrastructure/grants/store";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
let db: D1Database;
const questions = [
  {
    key: "problem",
    label: "Problem społeczny",
    help: "Kogo dotyczy?",
    required: true,
    maxLength: 2000,
  },
  {
    key: "budget",
    label: "Budżet",
    help: "",
    required: false,
    maxLength: 2000,
  },
];
before(async () => {
  fixture = await testDatabase();
  db = fixture.db as unknown as D1Database;
});
after(async () => {
  await fixture?.dispose();
});
async function call() {
  const version = new Date().toISOString();
  const row = await db
    .prepare(
      "INSERT INTO grant_calls(title,description,opens_at,closes_at,published,questions,updated_at) VALUES('Grant testowy','Warunki naboru',?,?,1,?,?) RETURNING id",
    )
    .bind(
      new Date(Date.now() - 3600000).toISOString(),
      new Date(Date.now() + 3600000).toISOString(),
      JSON.stringify(questions),
      version,
    )
    .first<{ id: number }>();
  assert.ok(row);
  return { id: row.id, version };
}
function input(grant: { id: number; version: string }): GrantApplication {
  return {
    id: crypto.randomUUID(),
    callId: grant.id,
    callVersion: grant.version,
    name: "Anna Kowalska",
    email: "anna@example.pl",
    consent: true,
    answers: { problem: "Seniorzy potrzebują pomocy sąsiedzkiej." },
  };
}
test("applications save a call-specific immutable snapshot and retry after closing", async () => {
  const grant = await call();
  const application = input(grant);
  const submission = await prepareGrantSubmission(db, application);
  await insertSubmission(db, submission);
  await db
    .prepare(
      "UPDATE grant_calls SET questions=?, closes_at='2000-01-01T00:00:00Z', updated_at=? WHERE id=?",
    )
    .bind(
      JSON.stringify([{ ...questions[0], label: "Nowe pytanie" }]),
      "changed",
      grant.id,
    )
    .run();
  const retry = await prepareGrantSubmission(db, application);
  assert.deepEqual(await insertSubmission(db, retry), { id: application.id });
  const snapshot = await db
    .prepare("SELECT call_snapshot, details FROM submissions WHERE id=?")
    .bind(application.id)
    .first<{ call_snapshot: string; details: string }>();
  assert.match(snapshot?.call_snapshot ?? "", /Problem społeczny/);
  assert.doesNotMatch(snapshot?.call_snapshot ?? "", /Nowe pytanie/);
  assert.match(snapshot?.details ?? "", /Seniorzy/);
  await assert.rejects(prepareGrantSubmission(db, input(grant)));
  await assert.rejects(
    insertSubmission(
      db,
      await prepareGrantSubmission(db, {
        ...application,
        answers: { problem: "Zmieniona treść" },
      }),
    ),
  );
});
test("closing or editing a call between review and insert prevents acceptance", async () => {
  const grant = await call();
  const submission = await prepareGrantSubmission(db, input(grant));
  await db
    .prepare(
      "UPDATE grant_calls SET closes_at='2000-01-01T00:00:00Z' WHERE id=?",
    )
    .bind(grant.id)
    .run();
  await assert.rejects(insertSubmission(db, submission));
  const edited = await call();
  const other = await prepareGrantSubmission(db, input(edited));
  await db
    .prepare("UPDATE grant_calls SET updated_at='changed' WHERE id=?")
    .bind(edited.id)
    .run();
  await assert.rejects(insertSubmission(db, other));
});
test("unpublished, upcoming, stale and invalid applications are rejected", async () => {
  const grant = await call();
  const application = input(grant);
  for (const malformed of [
    { ...application, consent: false },
    { ...application, email: "invalid" },
  ])
    assert.equal(grantApplicationSchema.safeParse(malformed).success, false);
  await assert.rejects(
    prepareGrantSubmission(db, { ...application, callVersion: "old" }),
  );
  await assert.rejects(
    prepareGrantSubmission(db, { ...application, answers: {} }),
  );
  await assert.rejects(
    prepareGrantSubmission(db, {
      ...application,
      answers: { problem: "Fine", injected: "Unknown" },
    }),
  );
  await db
    .prepare("UPDATE grant_calls SET published=0 WHERE id=?")
    .bind(grant.id)
    .run();
  await assert.rejects(prepareGrantSubmission(db, application));
  await db
    .prepare(
      "UPDATE grant_calls SET published=1, opens_at='2999-01-01T00:00:00Z' WHERE id=?",
    )
    .bind(grant.id)
    .run();
  await assert.rejects(prepareGrantSubmission(db, application));
  assert.equal((await getGrantCall(db, grant.id))?.questions[0].key, "problem");
});
