import assert from "node:assert/strict";
import { test } from "node:test";
import {
  callIsActive,
  type GrantCall,
  grantQuestionsSchema,
  validateGrantAnswers,
} from "@/domain/grants";
import { createChatModel } from "@/infrastructure/ai/openrouter";
import { generateGrantDraft } from "@/infrastructure/grants/draft";

const call: GrantCall = {
  id: 1,
  title: "Pomoc sąsiedzka",
  description: "Nabór dla innowacji społecznych.",
  published: true,
  opensAt: "2026-01-01T00:00:00Z",
  closesAt: "2026-02-01T00:00:00Z",
  updatedAt: "2025-12-01T00:00:00Z",
  questions: [
    {
      key: "problem",
      label: "Jaki problem rozwiązujesz?",
      help: "",
      required: true,
      maxLength: 100,
    },
    {
      key: "budget",
      label: "Budżet",
      help: "",
      required: false,
      maxLength: 100,
    },
  ],
};
test("calls open inclusively and close exclusively, with publication required", () => {
  assert.equal(callIsActive(call, Date.parse(call.opensAt) - 1), false);
  assert.equal(callIsActive(call, Date.parse(call.opensAt)), true);
  assert.equal(callIsActive(call, Date.parse(call.closesAt)), false);
  assert.equal(
    callIsActive({ ...call, published: false }, Date.parse(call.opensAt)),
    false,
  );
});
test("call questions have unique stable keys and enforce required answers and limits", () => {
  assert.equal(
    grantQuestionsSchema.safeParse([call.questions[0], call.questions[0]])
      .success,
    false,
  );
  assert.throws(() => validateGrantAnswers(call, {}));
  assert.throws(() => validateGrantAnswers(call, { problem: "a".repeat(101) }));
  assert.throws(() =>
    validateGrantAnswers(call, {
      problem: "Seniorzy",
      fabricated: "Nieznane pytanie",
    }),
  );
  validateGrantAnswers(call, { problem: "Samotność seniorów" });
});
test("grant draft uses the selected call schema and rules, without personal contact details", async () => {
  let requested = false;
  const model = createChatModel("fixture", async (_url, init) => {
    requested = true;
    const body = JSON.parse(String(init?.body));
    const serialized = JSON.stringify(body);
    assert.match(serialized, /Jaki problem rozwiązujesz/);
    assert.match(serialized, /Nie wymyślaj/);
    assert.doesNotMatch(serialized, /anna@example/);
    return Response.json({
      id: "fixture",
      model: "fixture",
      created: 1,
      choices: [
        {
          index: 0,
          finish_reason: "stop",
          message: {
            role: "assistant",
            content: JSON.stringify({
              answers: { problem: "Samotność seniorów", budget: "" },
              guidance: "Jaki budżet planujesz?",
            }),
          },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    });
  });
  const draft = await generateGrantDraft(
    call,
    {
      callVersion: call.updatedAt,
      idea: "Chcę pomagać seniorom w okolicy.",
      answers: {},
    },
    model,
    new AbortController().signal,
  );
  assert.equal(requested, true);
  assert.equal(draft.answers.problem, "Samotność seniorów");
  assert.equal(draft.answers.budget, "");
});
