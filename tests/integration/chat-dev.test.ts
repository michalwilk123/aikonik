import assert from "node:assert/strict";
import { test } from "node:test";
import { agentIds } from "@/agents/registry";
import { startTurn } from "@/application/chat/runtime";
import { type ChatAnswer, chatEventSchema } from "@/domain/chat/types";
import { makeDevChatAgent } from "@/infrastructure/chat/dev-agent";
import { insertSubmission } from "@/infrastructure/cms/submissions";
import { listInnovations } from "@/infrastructure/innovations/store";
import { verifyAgentSubmission } from "@/infrastructure/submissions/agent";
import { testDatabase } from "@/tests/helpers/d1";

test("DEV previews stream every agent's UI, persist without model calls and submit the Canvas", async () => {
  const fixture = await testDatabase();
  try {
    for (const agentId of agentIds) {
      const input = {
        agentId,
        conversationId: crypto.randomUUID(),
        capability: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        text: "Pokaż wszystkie funkcje",
      };
      const events = await startTurn(
        fixture.store,
        makeDevChatAgent(agentId, () =>
          listInnovations(fixture.db as unknown as D1Database),
        ),
        input,
        {},
        new AbortController().signal,
      );
      let answer: ChatAnswer | undefined;
      let textEvents = 0;
      for await (const raw of events) {
        const event = chatEventSchema.parse(raw);
        if (event.type === "text") textEvents++;
        if (event.type === "complete") answer = event.answer;
        assert.notEqual(event.type, "error");
      }
      assert.ok(answer);
      assert.ok(textEvents > 0, `${agentId} must stream preview text`);
      assert.ok(answer.message.length <= 600);
      if (agentId === "odkrywaj") {
        assert.ok(answer.videos?.length);
        assert.equal(answer.artifact, null);
      } else if (agentId === "wdrazanie-innowacji") {
        assert.ok(answer.videos?.length);
        assert.ok(
          answer.sources?.every((source) =>
            source.id.startsWith("innovation:"),
          ),
        );
        assert.ok(answer.artifact?.title.includes("BaWita"));
        assert.ok(
          answer.artifact?.fields.some(
            (field) => field.label === "Co zachować i co dostosować",
          ),
        );
        assert.equal(answer.visualizations, undefined);
      } else if (agentId === "wiedza") {
        assert.deepEqual(
          answer.visualizations?.map((chart) => chart.kind),
          ["map", "bar"],
        );
        assert.ok((answer.visualizations?.[0].points.length ?? 0) > 20);
        assert.match(answer.visualizations?.[0].title ?? "", /fikcyjne/);
      } else {
        assert.ok(answer.artifact?.fields.length);
      }
      if (agentId === "dodaj-pomysl") {
        assert.ok(answer.artifact);
        const submission = {
          ...input,
          id: crypto.randomUUID(),
          source: "dodaj-pomysl" as const,
          artifact: answer.artifact,
          name: "Test",
          surname: "Lokalny",
          email: "dev@example.com",
          consent: true as const,
        };
        const artifact = await verifyAgentSubmission(
          fixture.db as unknown as D1Database,
          submission,
        );
        const receipt = await insertSubmission(
          fixture.db as unknown as D1Database,
          {
            ...submission,
            subject: artifact.title,
            sourceTurnId: input.requestId,
          },
        );
        assert.equal(receipt.id, submission.id);
      }
    }
    assert.equal(
      await fixture.db
        .prepare("SELECT count(*) AS n FROM model_calls")
        .first("n"),
      0,
    );
    assert.equal(
      await fixture.db
        .prepare("SELECT count(*) AS n FROM turns WHERE status = 'complete'")
        .first("n"),
      5,
    );
  } finally {
    await fixture.dispose();
  }
});
