import assert from "node:assert/strict";
import { test } from "node:test";
import { artifactSchema } from "@/agents/types";
import type { GrantCall } from "@/domain/grants";
import { validateGrantAnswers } from "@/domain/grants";
import { getStaffThread, getThread } from "@/infrastructure/requests/service";
import { demoCaseIds, demoStatements } from "@/scripts/cms-demo-data";
import { testDatabase } from "@/tests/helpers/d1";

test("CMS demo fills every assigned inbox, preserves edits and creates no email or public call", async () => {
  const fixture = await testDatabase();
  const db = fixture.db;
  try {
    const seed = async () =>
      db.batch(
        demoStatements(new Date("2026-10-04T12:00:00Z")).map((sql) =>
          db.prepare(sql),
        ),
      );
    await seed();
    assert.equal(
      (
        await db
          .prepare("SELECT count(*) AS count FROM submissions")
          .first<{ count: number }>()
      )?.count,
      0,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT count(*) AS count FROM grant_calls")
          .first<{ count: number }>()
      )?.count,
      0,
    );
    await db
      .prepare(
        "INSERT INTO users (id,name,email,role) VALUES (7,'Pracownik CMS','cms@hubmi.invalid','cms'), (8,'Administrator','admin@hubmi.invalid','admin')",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO submissions (id,submitted_at,source,subject,name,email,status) VALUES ('existing','2026-01-01T00:00:00Z','contact','Istniejąca sprawa','Osoba','existing@hubmi.invalid','new')",
      )
      .run();
    await seed();
    const inboxes = await db
      .prepare(
        "SELECT source,count(*) AS count FROM submissions WHERE assigned_to_id=7 GROUP BY source",
      )
      .all<{ source: string; count: number }>();
    assert.equal(inboxes.results.length, 4);
    assert.ok(inboxes.results.every((inbox) => inbox.count === 4));
    const submissions = await db
      .prepare(
        "SELECT id,artifact,call_snapshot,internal_notes,email FROM submissions WHERE assigned_to_id=7",
      )
      .all<{
        id: string;
        artifact: string | null;
        call_snapshot: string | null;
        internal_notes: string;
        email: string;
      }>();
    for (const row of submissions.results) {
      assert.ok(row.internal_notes.startsWith("DANE DEMONSTRACYJNE"));
      assert.ok(row.email.endsWith("@hubmi.invalid"));
      if (row.artifact) artifactSchema.parse(JSON.parse(row.artifact));
      if (row.call_snapshot) {
        const call = JSON.parse(row.call_snapshot) as GrantCall;
        const artifact = artifactSchema.parse(JSON.parse(row.artifact ?? ""));
        validateGrantAnswers(
          call,
          Object.fromEntries(
            call.questions.map((q, index) => [
              q.key,
              artifact.fields[index].value,
            ]),
          ),
        );
        assert.equal(call.published, false);
      }
    }
    const id = demoCaseIds[1];
    const staffThread = await getStaffThread(db as unknown as D1Database, id, {
      id: 7,
      role: "cms",
    });
    assert.equal(staffThread.messages.length, 3);
    assert.equal(staffThread.messages[2].internal, true);
    const publicThread = await getThread(db as unknown as D1Database, id);
    assert.equal(publicThread.messages.length, 2);
    await assert.rejects(
      getStaffThread(db as unknown as D1Database, id, { id: 8, role: "cms" }),
    );
    await db
      .prepare(
        "UPDATE submissions SET status='completed',internal_notes='Zmieniono podczas prezentacji' WHERE id=?",
      )
      .bind(id)
      .run();
    await seed();
    assert.equal(
      (
        await db
          .prepare("SELECT count(*) AS count FROM submissions")
          .first<{ count: number }>()
      )?.count,
      17,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT count(*) AS count FROM request_messages")
          .first<{ count: number }>()
      )?.count,
      36,
    );
    assert.deepEqual(
      await db
        .prepare("SELECT status,internal_notes FROM submissions WHERE id=?")
        .bind(id)
        .first(),
      { status: "completed", internal_notes: "Zmieniono podczas prezentacji" },
    );
    assert.equal(
      (
        await db
          .prepare("SELECT count(*) AS count FROM request_notifications")
          .first<{ count: number }>()
      )?.count,
      0,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT count(*) AS count FROM users")
          .first<{ count: number }>()
      )?.count,
      2,
    );
    assert.equal(
      (
        await db
          .prepare(
            "SELECT count(*) AS count FROM grant_calls WHERE published=1",
          )
          .first<{ count: number }>()
      )?.count,
      0,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT assigned_to_id FROM submissions WHERE id='existing'")
          .first<{ assigned_to_id: number | null }>()
      )?.assigned_to_id,
      null,
    );
  } finally {
    await fixture.dispose();
  }
});
